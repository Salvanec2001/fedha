import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PushService } from '../notifications/push.service';
import { CreateTransactionDto, ListTransactionsQuery } from './dto/transaction.dto';
import { formatMoney } from '../common/format-money';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly push: PushService,
  ) {}

  async create(userId: string, dto: CreateTransactionDto) {
    const account = await this.prisma.account.findUnique({ where: { id: dto.accountId } });
    if (!account || account.userId !== userId) {
      throw new ForbiddenException('Account does not belong to this user');
    }

    let toAccount = null;
    if (dto.type === 'TRANSFER') {
      const hasInternalTarget = !!dto.toAccountId;
      const hasExternalTarget = !!dto.externalRecipientName;

      if (!hasInternalTarget && !hasExternalTarget) {
        throw new BadRequestException(
          'A transfer needs either a destination account or an external recipient name',
        );
      }
      if (hasInternalTarget && hasExternalTarget) {
        throw new BadRequestException('Choose either an internal account or an external recipient, not both');
      }
      if (hasInternalTarget) {
        if (dto.toAccountId === dto.accountId) {
          throw new BadRequestException('Cannot transfer an account to itself');
        }
        toAccount = await this.prisma.account.findUnique({ where: { id: dto.toAccountId } });
        if (!toAccount || toAccount.userId !== userId) {
          throw new ForbiddenException('Destination account does not belong to this user');
        }
      }
    }

    const transaction = await this.prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          type: dto.type,
          amount: dto.amount,
          currency: dto.currency ?? account.currency,
          occurredAt: new Date(dto.occurredAt),
          accountId: dto.accountId,
          toAccountId: dto.type === 'TRANSFER' ? dto.toAccountId ?? null : null,
          externalRecipientName: dto.type === 'TRANSFER' ? dto.externalRecipientName ?? null : null,
          externalRecipientAccountNumber:
            dto.type === 'TRANSFER' ? dto.externalRecipientAccountNumber ?? null : null,
          categoryId: dto.categoryId,
          description: dto.description,
          counterparty: dto.counterparty,
        },
      });

      if (dto.type === 'INCOME') {
        await tx.account.update({
          where: { id: dto.accountId },
          data: { currentBalance: { increment: dto.amount } },
        });
      } else if (dto.type === 'EXPENSE') {
        await tx.account.update({
          where: { id: dto.accountId },
          data: { currentBalance: { decrement: dto.amount } },
        });
      } else if (dto.type === 'TRANSFER') {
        await tx.account.update({
          where: { id: dto.accountId },
          data: { currentBalance: { decrement: dto.amount } },
        });
        if (dto.toAccountId) {
          await tx.account.update({
            where: { id: dto.toAccountId },
            data: { currentBalance: { increment: dto.amount } },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'transaction.create',
          entity: 'transaction',
          entityId: created.id,
          after: created as any,
        },
      });

      return created;
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const label =
        transaction.type === 'INCOME' ? 'Income' : transaction.type === 'EXPENSE' ? 'Expense' : 'Transfer';
      this.notifications
        .sendEmail(
          userId,
          user.email,
          'transaction_created',
          `${label} recorded: ${formatMoney(transaction.amount, transaction.currency)}`,
          `Hi ${user.name},\n\nA ${label.toLowerCase()} of ${formatMoney(transaction.amount, transaction.currency)} was recorded${transaction.description ? ` ("${transaction.description}")` : ''} on ${new Date(transaction.occurredAt).toLocaleDateString()}.\n\nIf this wasn't you, please review your account.`,
        )
        .catch(() => {});
      this.push
        .notify(userId, `${label} recorded`, `${label} of ${formatMoney(transaction.amount, transaction.currency)} was recorded.`)
        .catch(() => {});
    }

    return transaction;
  }

  async findAllForUser(userId: string, query: ListTransactionsQuery) {
    const accountIds = (
      await this.prisma.account.findMany({ where: { userId }, select: { id: true } })
    ).map((a) => a.id);

    return this.prisma.transaction.findMany({
      where: {
        deletedAt: null,
        accountId: query.accountId ? query.accountId : { in: accountIds },
        categoryId: query.categoryId ?? undefined,
        type: query.type ?? undefined,
        occurredAt: {
          gte: query.from ? new Date(query.from) : undefined,
          lte: query.to ? new Date(query.to) : undefined,
        },
        ...(query.search
          ? {
              OR: [
                { description: { contains: query.search, mode: 'insensitive' } },
                { counterparty: { contains: query.search, mode: 'insensitive' } },
                { externalRecipientName: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { category: true, account: true, toAccount: true },
      orderBy: { occurredAt: 'desc' },
    });
  }

  async voidTransaction(userId: string, transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { account: true },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.account.userId !== userId) throw new ForbiddenException();
    if (transaction.deletedAt) throw new BadRequestException('Transaction already voided');

    return this.prisma.$transaction(async (tx) => {
      const reversed = await tx.transaction.update({
        where: { id: transactionId },
        data: { deletedAt: new Date() },
      });

      if (transaction.type === 'INCOME') {
        await tx.account.update({
          where: { id: transaction.accountId },
          data: { currentBalance: { decrement: transaction.amount } },
        });
      } else if (transaction.type === 'EXPENSE') {
        await tx.account.update({
          where: { id: transaction.accountId },
          data: { currentBalance: { increment: transaction.amount } },
        });
      } else if (transaction.type === 'TRANSFER') {
        await tx.account.update({
          where: { id: transaction.accountId },
          data: { currentBalance: { increment: transaction.amount } },
        });
        if (transaction.toAccountId) {
          await tx.account.update({
            where: { id: transaction.toAccountId },
            data: { currentBalance: { decrement: transaction.amount } },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'transaction.void',
          entity: 'transaction',
          entityId: transactionId,
          before: transaction as any,
          after: reversed as any,
        },
      });

      return reversed;
    });
  }
}
