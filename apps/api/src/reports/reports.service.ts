import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async buildReport(userId: string, from?: string, to?: string) {
    const accounts = await this.prisma.account.findMany({ where: { userId } });
    const accountIds = accounts.map((a) => a.id);

    const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const toDate = to ? new Date(to) : new Date();

    const transactions = await this.prisma.transaction.findMany({
      where: {
        accountId: { in: accountIds },
        deletedAt: null,
        occurredAt: { gte: fromDate, lte: toDate },
      },
      include: { category: true, account: true, toAccount: true },
      orderBy: { occurredAt: 'asc' },
    });

    const totalIncome = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const netCashFlow = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0;

    const byCategory = new Map<string, { name: string; group: string; total: number }>();
    for (const t of transactions) {
      if (t.type !== 'EXPENSE') continue;
      const key = t.category?.id ?? 'uncategorized';
      const existing = byCategory.get(key);
      if (existing) {
        existing.total += t.amount;
      } else {
        byCategory.set(key, {
          name: t.category?.name ?? 'Uncategorized',
          group: t.category?.group ?? 'PERSONAL',
          total: t.amount,
        });
      }
    }

    const totalBalance = accounts.reduce((s, a) => s + a.currentBalance, 0);
    const currency = accounts[0]?.currency ?? 'TZS';

    return {
      period: { from: fromDate, to: toDate },
      currency,
      totalBalance,
      totalIncome,
      totalExpenses,
      netCashFlow,
      savingsRate,
      accounts,
      categoryBreakdown: Array.from(byCategory.values()).sort((a, b) => b.total - a.total),
      transactions,
    };
  }
}
