import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PushService } from '../notifications/push.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';
import { formatMoney } from '../common/format-money';

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly push: PushService,
  ) {}

  async create(userId: string, dto: CreateAccountDto) {
    const account = await this.prisma.account.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        currency: dto.currency ?? 'TZS',
        currentBalance: dto.openingBalance ?? 0,
        institution: dto.institution,
      },
    });

    await this.prisma.auditLog.create({
      data: { userId, action: 'account.create', entity: 'account', entityId: account.id, after: account as any },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      this.notifications
        .sendEmail(
          userId,
          user.email,
          'account_created',
          'New account added to Fedha',
          `Hi ${user.name},\n\nA new account "${account.name}" (${account.type}) was added to your Fedha profile with an opening balance of ${formatMoney(account.currentBalance, account.currency)}.\n\nIf you didn't do this, please secure your account immediately.`,
        )
        .catch(() => {});
      this.push.notify(userId, 'Account added', `"${account.name}" was added to your accounts.`).catch(() => {});
    }

    return account;
  }

  async findAllForUser(userId: string) {
    return this.prisma.account.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOneOwned(userId: string, accountId: string) {
    const account = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Account not found');
    if (account.userId !== userId) throw new ForbiddenException();
    return account;
  }

  async update(userId: string, accountId: string, dto: UpdateAccountDto) {
    const existing = await this.findOneOwned(userId, accountId);
    const updated = await this.prisma.account.update({ where: { id: accountId }, data: dto });
    await this.prisma.auditLog.create({
      data: { userId, action: 'account.update', entity: 'account', entityId: accountId, before: existing as any, after: updated as any },
    });
    return updated;
  }

  async deactivate(userId: string, accountId: string) {
    const existing = await this.findOneOwned(userId, accountId);
    const updated = await this.prisma.account.update({ where: { id: accountId }, data: { isActive: false } });
    await this.prisma.auditLog.create({
      data: { userId, action: 'account.delete', entity: 'account', entityId: accountId, before: existing as any },
    });
    return updated;
  }
}
