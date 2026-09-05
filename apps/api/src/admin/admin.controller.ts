import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  async stats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, verifiedUsers, newToday, newThisWeek, newThisMonth, totalAccounts, totalTransactions] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { emailVerified: true } }),
        this.prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
        this.prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
        this.prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
        this.prisma.account.count(),
        this.prisma.transaction.count(),
      ]);

    const recentUsers = await this.prisma.user.findMany({
      where: { createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
      select: { createdAt: true },
    });
    const byDay: Record<string, number> = {};
    for (const u of recentUsers) {
      const day = u.createdAt.toISOString().slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + 1;
    }

    return {
      totalUsers,
      verifiedUsers,
      newToday,
      newThisWeek,
      newThisMonth,
      totalAccounts,
      totalTransactions,
      signupsByDay: byDay,
    };
  }
}
