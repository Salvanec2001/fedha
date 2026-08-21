import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: { categoryId?: string; name: string; period: string; amount: number }) {
    return this.prisma.budget.create({
      data: { userId, categoryId: dto.categoryId, name: dto.name, period: dto.period as any, amount: dto.amount },
    });
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

  async remove(userId: string, id: string) {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget) throw new NotFoundException('Budget not found');
    if (budget.userId !== userId) throw new ForbiddenException();
    return this.prisma.budget.delete({ where: { id } });
  }
}
