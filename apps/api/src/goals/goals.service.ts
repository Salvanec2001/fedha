import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: { name: string; targetAmount: number; currentAmount?: number; deadline?: string; monthlyContribution?: number; priority?: string }) {
    return this.prisma.savingsGoal.create({
      data: {
        userId,
        name: dto.name,
        targetAmount: dto.targetAmount,
        currentAmount: dto.currentAmount ?? 0,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        monthlyContribution: dto.monthlyContribution ?? 0,
        priority: dto.priority ?? 'MEDIUM',
      },
    });
  }

  async findAllForUser(userId: string) {
    const goals = await this.prisma.savingsGoal.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
    const now = new Date();

    return goals.map((g) => {
      const progressPct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
      const remaining = Math.max(0, g.targetAmount - g.currentAmount);
      let monthsToGoal: number | null = null;
      let onTrack: boolean | null = null;

      if (g.monthlyContribution > 0) {
        monthsToGoal = Math.ceil(remaining / g.monthlyContribution);
      }
      if (g.deadline) {
        const monthsUntilDeadline = Math.max(
          0,
          (g.deadline.getFullYear() - now.getFullYear()) * 12 + (g.deadline.getMonth() - now.getMonth()),
        );
        if (monthsToGoal !== null) {
          onTrack = monthsToGoal <= monthsUntilDeadline;
        }
      }

      return { ...g, progressPct, remaining, monthsToGoal, onTrack };
    });
  }

  async contribute(userId: string, id: string, amount: number) {
    const goal = await this.prisma.savingsGoal.findUnique({ where: { id } });
    if (!goal) throw new NotFoundException('Goal not found');
    if (goal.userId !== userId) throw new ForbiddenException();
    return this.prisma.savingsGoal.update({
      where: { id },
      data: { currentAmount: { increment: amount } },
    });
  }

  async remove(userId: string, id: string) {
    const goal = await this.prisma.savingsGoal.findUnique({ where: { id } });
    if (!goal) throw new NotFoundException('Goal not found');
    if (goal.userId !== userId) throw new ForbiddenException();
    return this.prisma.savingsGoal.delete({ where: { id } });
  }
}
