import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../notifications/push.service';

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  async create(userId: string, dto: { name: string; targetAmount: number; currentAmount?: number; deadline?: string; monthlyContribution?: number; priority?: string }) {
    const goal = await this.prisma.savingsGoal.create({
      data: {
        userId,
        name: dto.name,
        targetAmount: dto.targetAmount,
        currentAmount: dto.currentAmount ?? 0,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        monthlyContribution: dto.monthlyContribution ?? 0,
        priority: (dto.priority ?? 'MEDIUM') as any,
      },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: 'goal.create', entity: 'savings_goal', entityId: goal.id, after: goal as any },
    });
    this.push.notify(userId, 'Savings goal created', `"${goal.name}" goal was created.`).catch(() => {});
    return goal;
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

  async update(userId: string, id: string, dto: { name?: string; targetAmount?: number; monthlyContribution?: number; deadline?: string }) {
    const existing = await this.prisma.savingsGoal.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Goal not found');
    if (existing.userId !== userId) throw new ForbiddenException();
    const updated = await this.prisma.savingsGoal.update({
      where: { id },
      data: {
        name: dto.name,
        targetAmount: dto.targetAmount,
        monthlyContribution: dto.monthlyContribution,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: 'goal.update', entity: 'savings_goal', entityId: id, before: existing as any, after: updated as any },
    });
    return updated;
  }

  async contribute(userId: string, id: string, amount: number) {
    const goal = await this.prisma.savingsGoal.findUnique({ where: { id } });
    if (!goal) throw new NotFoundException('Goal not found');
    if (goal.userId !== userId) throw new ForbiddenException();
    const updated = await this.prisma.savingsGoal.update({
      where: { id },
      data: { currentAmount: { increment: amount } },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: 'goal.contribute', entity: 'savings_goal', entityId: id, before: goal as any, after: updated as any },
    });
    if (updated.currentAmount >= updated.targetAmount) {
      this.push.notify(userId, 'Goal reached! 🎉', `You've reached your "${updated.name}" savings goal.`).catch(() => {});
    }
    return updated;
  }

  async remove(userId: string, id: string) {
    const goal = await this.prisma.savingsGoal.findUnique({ where: { id } });
    if (!goal) throw new NotFoundException('Goal not found');
    if (goal.userId !== userId) throw new ForbiddenException();
    await this.prisma.auditLog.create({
      data: { userId, action: 'goal.delete', entity: 'savings_goal', entityId: id, before: goal as any },
    });
    return this.prisma.savingsGoal.delete({ where: { id } });
  }
}
