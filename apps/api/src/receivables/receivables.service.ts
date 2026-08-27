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

  private computeStatus(
    amount: number,
    remainingBalance: number,
    expectedRepaymentDate: Date | null,
  ): 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' {
    if (remainingBalance <= 0) return 'PAID';
    if (expectedRepaymentDate && expectedRepaymentDate < new Date()) return 'OVERDUE';
    if (remainingBalance < amount) return 'PARTIALLY_PAID';
    return 'PENDING';
  }

  async create(userId: string, dto: { debtorName: string; amount: number; expectedRepaymentDate?: string; notes?: string }) {
    const receivable = await this.prisma.receivable.create({
      data: {
        userId,
        debtorName: dto.debtorName,
        amount: dto.amount,
        remainingBalance: dto.amount,
        expectedRepaymentDate: dto.expectedRepaymentDate ? new Date(dto.expectedRepaymentDate) : null,
        notes: dto.notes,
      },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: 'receivable.create', entity: 'receivable', entityId: receivable.id, after: receivable as any },
    });
    this.push.notify(userId, 'Receivable recorded', `You recorded ${dto.debtorName} owing you ${formatMoney(receivable.amount)}.`).catch(() => {});
    return receivable;
  }

  async findAllForUser(userId: string) {
    const receivables = await this.prisma.receivable.findMany({
      where: { userId },
      include: { payments: { orderBy: { paidAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });

    const results = [];
    for (const r of receivables) {
      const status = this.computeStatus(r.amount, r.remainingBalance, r.expectedRepaymentDate);
      if (status !== r.status) {
        await this.prisma.receivable.update({ where: { id: r.id }, data: { status } });
      }
      results.push({ ...r, status });
    }
    return results;
  }

  async addPayment(userId: string, receivableId: string, amount: number, notes?: string) {
    const receivable = await this.prisma.receivable.findUnique({ where: { id: receivableId } });
    if (!receivable) throw new NotFoundException('Receivable not found');
    if (receivable.userId !== userId) throw new ForbiddenException();
    if (amount <= 0) throw new BadRequestException('Payment amount must be positive');
    if (amount > receivable.remainingBalance) {
      throw new BadRequestException('Payment cannot exceed the remaining balance');
    }

    const [payment, updated] = await this.prisma.$transaction([
      this.prisma.receivablePayment.create({ data: { receivableId, amount, notes } }),
      this.prisma.receivable.update({
        where: { id: receivableId },
        data: { remainingBalance: { decrement: amount } },
      }),
    ]);

    const finalStatus = this.computeStatus(updated.amount, updated.remainingBalance, updated.expectedRepaymentDate);
    if (finalStatus !== updated.status) {
      await this.prisma.receivable.update({ where: { id: receivableId }, data: { status: finalStatus } });
    }

    await this.prisma.auditLog.create({
      data: { userId, action: 'receivable.payment', entity: 'receivable', entityId: receivableId, after: payment as any },
    });

    if (finalStatus === 'PAID') {
      this.push.notify(userId, 'Receivable fully repaid', `${receivable.debtorName} has fully repaid you.`).catch(() => {});
    }

    return { payment, remainingBalance: updated.remainingBalance, status: finalStatus };
  }

  async update(userId: string, id: string, dto: { debtorName?: string; expectedRepaymentDate?: string; notes?: string }) {
    const existing = await this.prisma.receivable.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Receivable not found');
    if (existing.userId !== userId) throw new ForbiddenException();
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

  async remove(userId: string, id: string) {
    const receivable = await this.prisma.receivable.findUnique({ where: { id } });
    if (!receivable) throw new NotFoundException('Receivable not found');
    if (receivable.userId !== userId) throw new ForbiddenException();
    await this.prisma.auditLog.create({
      data: { userId, action: 'receivable.delete', entity: 'receivable', entityId: id, before: receivable as any },
    });
    return this.prisma.receivable.delete({ where: { id } });
  }
}
