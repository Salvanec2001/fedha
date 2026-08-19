import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string) {
    const accounts = await this.prisma.account.findMany({ where: { userId, isActive: true } });

    const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const accountIds = accounts.map((a) => a.id);

    const monthTransactions = await this.prisma.transaction.findMany({
      where: {
        accountId: { in: accountIds },
        deletedAt: null,
        occurredAt: { gte: startOfMonth, lt: startOfNextMonth },
        type: { in: ['INCOME', 'EXPENSE'] },
      },
    });

    const incomeThisMonth = monthTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const expensesThisMonth = monthTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const netCashFlow = incomeThisMonth - expensesThisMonth;

    return {
      asOf: now.toISOString(),
      currency: accounts[0]?.currency ?? 'TZS',
      totalBalance,
      incomeThisMonth,
      expensesThisMonth,
      netCashFlow,
      accounts: accounts.map((a) => ({ id: a.id, name: a.name, type: a.type, currentBalance: a.currentBalance })),
    };
  }
}
