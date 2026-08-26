import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../notifications/push.service';
import { formatMoney } from '../common/format-money';

@Injectable()
export class DebtsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  async create(userId: string, dto: { creditorName: string; principal: number; interestRate?: number; dueDate?: string; notes?: string }) {
    const debt = await this.prisma.debt.create({
      data: {
        userId,
        creditorName: dto.creditorName,
        principal: dto.principal,
        remainingBalance: dto.principal,
        interestRate: dto.interestRate,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        notes: dto.notes,
      },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: 'debt.create', entity: 'debt', entityId: debt.id, after: debt as any },
    });
    this.push.notify(userId, 'Debt recorded', `${dto.creditorName}: ${formatMoney(dto.principal)}`).catch(() => {});
    return debt;
  }

  private withComputedStatus<T extends { dueDate: Date | null; remainingBalance: number; status: string }>(item: T): T {
    if (item.remainingBalance <= 0) return { ...item, status: 'PAID' };
    if (item.dueDate && item.dueDate < new Date()) return { ...item, status: 'OVERDUE' };
    return { ...item, status: item.status === 'PAID' ? 'ACTIVE' : item.status };
  }

  async findAllForUser(userId: string) {
    const debts = await this.prisma.debt.findMany({
      where: { userId },
      include: { payments: { orderBy: { paidAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return debts.map((d) => this.withComputedStatus(d));
  }

  private async findOwned(userId: string, id: string) {
    const debt = await this.prisma.debt.findUnique({ where: { id } });
    if (!debt) throw new NotFoundException('Debt not found');
    if (debt.userId !== userId) throw new ForbiddenException();
    return debt;
  }

  async update(userId: string, id: string, dto: { creditorName?: string; dueDate?: string; interestRate?: number; notes?: string }) {
    const existing = await this.findOwned(userId, id);
    const updated = await this.prisma.debt.update({
      where: { id },
      data: {
        creditorName: dto.creditorName,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        interestRate: dto.interestRate,
        notes: dto.notes,
      },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: 'debt.update', entity: 'debt', entityId: id, before: existing as any, after: updated as any },
    });
    return updated;
  }

  async addPayment(userId: string, id: string, amount: number, notes?: string) {
    const debt = await this.findOwned(userId, id);
    if (amount <= 0) throw new BadRequestException('Payment amount must be positive');
    if (amount > debt.remainingBalance) {
      throw new BadRequestException('Payment cannot exceed the remaining balance');
    }

    const [payment, updated] = await this.prisma.$transaction([
      this.prisma.debtPayment.create({ data: { debtId: id, amount, notes } }),
      this.prisma.debt.update({
        where: { id },
        data: {
          remainingBalance: { decrement: amount },
          status: debt.remainingBalance - amount <= 0 ? 'PAID' : 'ACTIVE',
        },
      }),
    ]);

    await this.prisma.auditLog.create({
      data: { userId, action: 'debt.payment', entity: 'debt', entityId: id, after: payment as any },
    });

    if (updated.remainingBalance <= 0) {
      this.push.notify(userId, 'Debt paid off! 🎉', `You've fully paid off your debt to ${debt.creditorName}.`).catch(() => {});
    } else {
      this.push.notify(userId, 'Debt payment recorded', `${formatMoney(amount)} paid toward ${debt.creditorName}.`).catch(() => {});
    }

    return updated;
  }

  async remove(userId: string, id: string) {
    const debt = await this.findOwned(userId, id);
    await this.prisma.auditLog.create({
      data: { userId, action: 'debt.delete', entity: 'debt', entityId: id, before: debt as any },
    });
    return this.prisma.debt.delete({ where: { id } });
  }
}
