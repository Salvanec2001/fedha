import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async search(@CurrentUser() user: { userId: string }, @Query('q') q: string) {
    if (!q || q.trim().length === 0) {
      return { transactions: [], accounts: [], budgets: [], goals: [], debts: [], receivables: [] };
    }
    const userId = user.userId;
    const term = q.trim();

    const accountIds = (await this.prisma.account.findMany({ where: { userId }, select: { id: true } })).map((a) => a.id);

    const [transactions, accounts, budgets, goals, debts, receivables] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          accountId: { in: accountIds },
          deletedAt: null,
          OR: [
            { description: { contains: term, mode: 'insensitive' } },
            { counterparty: { contains: term, mode: 'insensitive' } },
            { externalRecipientName: { contains: term, mode: 'insensitive' } },
          ],
        },
        include: { account: true, category: true },
        orderBy: { occurredAt: 'desc' },
        take: 20,
      }),
      this.prisma.account.findMany({
        where: { userId, name: { contains: term, mode: 'insensitive' } },
        take: 20,
      }),
      this.prisma.budget.findMany({
        where: { userId, name: { contains: term, mode: 'insensitive' } },
        take: 20,
      }),
      this.prisma.savingsGoal.findMany({
        where: { userId, name: { contains: term, mode: 'insensitive' } },
        take: 20,
      }),
      this.prisma.debt.findMany({
        where: { userId, creditorName: { contains: term, mode: 'insensitive' } },
        take: 20,
      }),
      this.prisma.receivable.findMany({
        where: { userId, debtorName: { contains: term, mode: 'insensitive' } },
        take: 20,
      }),
    ]);

    return { transactions, accounts, budgets, goals, debts, receivables };
  }
}
