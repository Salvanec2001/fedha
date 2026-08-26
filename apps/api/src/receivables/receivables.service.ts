import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../notifications/push.service';
import { formatMoney } from '../common/format-money';

@Injectable()
export class ReceivablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  async create(userId: string, dto: { debtorName: string; amount: number; expectedRepaymentDate?: string; notes?: string }) {
    const receivable = await this.prisma.receivable.create({
      data: {
        userId,
        debtorName: dto.debtorName,
        amount: dto.amount,
        remainingBalance: dto.amount,
        expectedRepaymentDate: dto.expectedRepaymentDate ? new Date(dto.expectedRepaymentDate) : undefined,
        notes: dto.notes,
      },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: 'receivable.create', entity: 'receivable', entityId: receivable.id, after: receivable as any },
    });
    this.push.notify(userId, 'Receivable recorded', `${dto.debtorName} owes you ${formatMoney(dto.amount)}.`).catch(() => {});
    return receivable;
  }

  private withComputedStatus<T extends { expectedRepaymentDate: Date | null; remainingBalance: number; amount: number; status: string }>(item: T): T {
    if (item.remainingBalance <= 0) return { ...item, status: 'PAID' };
    if (item.expectedRepaymentDate && item.expectedRepaymentDate < new Date()) return { ...item, status: 'OVERDUE' };
    if (item.remainingBalance < item.amount) return { ...item, status: 'PARTIALLY_PAID' };
    return { ...item, status: item.status === 'PAID' ? 'PENDING' : item.status };
  }

  async findAllForUser(userId: string) {
    const receivables = await this.prisma.receivable.findMany({
      where: { userId },
      include: { payments: { orderBy: { paidAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return receivables.map((r) => this.withComputedStatus(r));
  }

  private async findOwned(userId: string, id: string) {
    const receivable = await this.prisma.receivable.findUnique({ where: { id } });
    if (!receivable) throw new NotFoundException('Receivable not found');
    if (receivable.userId !== userId) throw new ForbiddenException();
    return receivable;
  }

  async update(userId: string, id: string, dto: { debtorName?: string; expectedRepaymentDate?: string; notes?: string }) {
    const existing = await this.findOwned(userId, id);
    const updated = await this.prisma.receivable.update({
      where: { id },
      data: {
        debtorName: dto.debtorName,
        expectedRepaymentDate: dto.expectedRepaymentDate ? new Date(dto.expectedRepaymentDate) : undefined,
        notes: dto.notes,
      },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: 'receivable.update', entity: 'receivable', entityId: id, before: existing as any, after: updated as any },
    });
    return updated;
  }

  async addPayment(userId: string, id: string, amount: number, notes?: string) {
    const receivable = await this.findOwned(userId, id);
    if (amount <= 0) throw new BadRequestException('Payment amount must be positive');
    if (amount > receivable.remainingBalance) {
      throw new BadRequestException('Payment cannot exceed the remaining balance');
    }

    const newRemaining = receivable.remainingBalance - amount;
    const [payment, updated] = await this.prisma.$transaction([
      this.prisma.receivablePayment.create({ data: { receivableId: id, amount, notes } }),
      this.prisma.receivable.update({
        where: { id },
        data: {
          remainingBalance: { decrement: amount },
          status: newRemaining <= 0 ? 'PAID' : 'PARTIALLY_PAID',
        },
      }),
    ]);

    await this.prisma.auditLog.create({
      data: { userId, action: 'receivable.payment', entity: 'receivable', entityId: id, after: payment as any },
    });

    if (updated.remainingBalance <= 0) {
      this.push.notify(userId, 'Fully repaid! 🎉', `${receivable.debtorName} has fully repaid you.`).catch(() => {});
    } else {
      this.push.notify(userId, 'Repayment received', `${formatMoney(amount)} received from ${receivable.debtorName}.`).catch(() => {});
    }

    return updated;
  }

  async remove(userId: string, id: string) {
    const receivable = await this.findOwned(userId, id);
    await this.prisma.auditLog.create({
      data: { userId, action: 'receivable.delete', entity: 'receivable', entityId: id, before: receivable as any },
    });
    return this.prisma.receivable.delete({ where: { id } });
  }
}
