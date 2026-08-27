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

  private computeStatus(remainingBalance: number, dueDate: Date | null): 'ACTIVE' | 'PAID' | 'OVERDUE' {
    if (remainingBalance <= 0) return 'PAID';
    if (dueDate && dueDate < new Date()) return 'OVERDUE';
    return 'ACTIVE';
  }

  async create(userId: string, dto: { creditorName: string; principal: number; interestRate?: number; dueDate?: string; notes?: string }) {
    const debt = await this.prisma.debt.create({
      data: {
        userId,
        creditorName: dto.creditorName,
        principal: dto.principal,
        remainingBalance: dto.principal,
        interestRate: dto.interestRate,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        notes: dto.notes,
      },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: 'debt.create', entity: 'debt', entityId: debt.id, after: debt as any },
    });
    this.push.notify(userId, 'Debt recorded', `You recorded owing ${formatMoney(debt.principal)} to ${debt.creditorName}.`).catch(() => {});
    return debt;
  }

  async findAllForUser(userId: string) {
    const debts = await this.prisma.debt.findMany({
      where: { userId },
      include: { payments: { orderBy: { paidAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });

    const results = [];
    for (const d of debts) {
      const status = this.computeStatus(d.remainingBalance, d.dueDate);
      if (status !== d.status) {
        await this.prisma.debt.update({ where: { id: d.id }, data: { status } });
      }
      results.push({ ...d, status });
    }
    return results;
  }

  async addPayment(userId: string, debtId: string, amount: number, notes?: string) {
    const debt = await this.prisma.debt.findUnique({ where: { id: debtId } });
    if (!debt) throw new NotFoundException('Debt not found');
    if (debt.userId !== userId) throw new ForbiddenException();
    if (amount <= 0) throw new BadRequestException('Payment amount must be positive');
    if (amount > debt.remainingBalance) {
      throw new BadRequestException('Payment cannot exceed the remaining balance');
    }

    const [payment, updated] = await this.prisma.$transaction([
      this.prisma.debtPayment.create({ data: { debtId, amount, notes } }),
      this.prisma.debt.update({
        where: { id: debtId },
        data: { remainingBalance: { decrement: amount } },
      }),
    ]);

    const finalStatus = this.computeStatus(updated.remainingBalance, updated.dueDate);
    if (finalStatus !== updated.status) {
      await this.prisma.debt.update({ where: { id: debtId }, data: { status: finalStatus } });
    }

    await this.prisma.auditLog.create({
      data: { userId, action: 'debt.payment', entity: 'debt', entityId: debtId, after: payment as any },
    });

    if (finalStatus === 'PAID') {
      this.push.notify(userId, 'Debt paid off! 🎉', `You've fully paid off your debt to ${debt.creditorName}.`).catch(() => {});
    }

    return { payment, remainingBalance: updated.remainingBalance, status: finalStatus };
  }

  async update(userId: string, id: string, dto: { creditorName?: string; dueDate?: string; interestRate?: number; notes?: string }) {
    const existing = await this.prisma.debt.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Debt not found');
    if (existing.userId !== userId) throw new ForbiddenException();
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

  async remove(userId: string, id: string) {
    const debt = await this.prisma.debt.findUnique({ where: { id } });
    if (!debt) throw new NotFoundException('Debt not found');
    if (debt.userId !== userId) throw new ForbiddenException();
    await this.prisma.auditLog.create({
      data: { userId, action: 'debt.delete', entity: 'debt', entityId: id, before: debt as any },
    });
    return this.prisma.debt.delete({ where: { id } });
  }
}
