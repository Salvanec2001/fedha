import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../notifications/push.service';

@Injectable()
export class BudgetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  async create(userId: string, dto: { categoryId?: string; name: string; period: string; amount: number }) {
    const budget = await this.prisma.budget.create({
      data: { userId, categoryId: dto.categoryId, name: dto.name, period: dto.period as any, amount: dto.amount },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: 'budget.create', entity: 'budget', entityId: budget.id, after: budget as any },
    });
    this.push.notify(userId, 'Budget created', `"${budget.name}" budget was created.`).catch(() => {});
    return budget;
  }

  async findAllForUser(userId: string) {
    const budgets = await this.prisma.budget.findMany({ where: { userId }, include: { category: true } });
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const results = [];
    for (const b of budgets) {
      const spent = await this.prisma.transaction.aggregate({
        where: {
          type: 'EXPENSE',
          deletedAt: null,
          categoryId: b.categoryId ?? undefined,
          occurredAt: { gte: startOfMonth },
          account: { userId },
        },
        _sum: { amount: true },
      });
      const spentAmount = spent._sum.amount ?? 0;
      results.push({
        ...b,
        spent: spentAmount,
        remaining: b.amount - spentAmount,
        percentUsed: b.amount > 0 ? Math.round((spentAmount / b.amount) * 100) : 0,
      });
    }
    return results;
  }

  async update(userId: string, id: string, dto: { name?: string; amount?: number; period?: string }) {
    const existing = await this.prisma.budget.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Budget not found');
    if (existing.userId !== userId) throw new ForbiddenException();
    const updated = await this.prisma.budget.update({
      where: { id },
      data: { name: dto.name, amount: dto.amount, period: dto.period as any },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: 'budget.update', entity: 'budget', entityId: id, before: existing as any, after: updated as any },
    });
    return updated;
  }

  async remove(userId: string, id: string) {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget) throw new NotFoundException('Budget not found');
    if (budget.userId !== userId) throw new ForbiddenException();
    await this.prisma.auditLog.create({
      data: { userId, action: 'budget.delete', entity: 'budget', entityId: id, before: budget as any },
    });
    return this.prisma.budget.delete({ where: { id } });
  }
}
