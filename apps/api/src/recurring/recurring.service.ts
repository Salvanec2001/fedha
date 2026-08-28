import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function advance(date: Date, frequency: string): Date {
  const d = new Date(date);
  switch (frequency) {
    case 'DAILY':
      d.setDate(d.getDate() + 1);
      break;
    case 'WEEKLY':
      d.setDate(d.getDate() + 7);
      break;
    case 'MONTHLY':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'YEARLY':
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d;
}

@Injectable()
export class RecurringService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: {
    name: string; type: 'INCOME' | 'EXPENSE'; amount: number; accountId: string;
    categoryId?: string; frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    startDate: string; endDate?: string; notes?: string;
  }) {
    const account = await this.prisma.account.findUnique({ where: { id: dto.accountId } });
    if (!account || account.userId !== userId) throw new ForbiddenException('Account does not belong to this user');

    const startDate = new Date(dto.startDate);
    const recurring = await this.prisma.recurringTransaction.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        amount: dto.amount,
        accountId: dto.accountId,
        categoryId: dto.categoryId,
        frequency: dto.frequency,
        startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        nextRunAt: startDate,
        notes: dto.notes,
      },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: 'recurring.create', entity: 'recurring_transaction', entityId: recurring.id, after: recurring as any },
    });
    return recurring;
  }

  async findAllForUser(userId: string) {
    return this.prisma.recurringTransaction.findMany({
      where: { userId },
      include: { account: true, category: true },
      orderBy: { nextRunAt: 'asc' },
    });
  }

  async setActive(userId: string, id: string, isActive: boolean) {
    const existing = await this.prisma.recurringTransaction.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Recurring transaction not found');
    if (existing.userId !== userId) throw new ForbiddenException();
    const updated = await this.prisma.recurringTransaction.update({ where: { id }, data: { isActive } });
    await this.prisma.auditLog.create({
      data: { userId, action: isActive ? 'recurring.resume' : 'recurring.pause', entity: 'recurring_transaction', entityId: id },
    });
    return updated;
  }

  async skipNext(userId: string, id: string) {
    const existing = await this.prisma.recurringTransaction.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Recurring transaction not found');
    if (existing.userId !== userId) throw new ForbiddenException();
    const nextRunAt = advance(existing.nextRunAt, existing.frequency);
    const updated = await this.prisma.recurringTransaction.update({ where: { id }, data: { nextRunAt } });
    await this.prisma.auditLog.create({
      data: { userId, action: 'recurring.skip', entity: 'recurring_transaction', entityId: id },
    });
    return updated;
  }

  async update(userId: string, id: string, dto: { name?: string; amount?: number; endDate?: string; notes?: string }) {
    const existing = await this.prisma.recurringTransaction.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Recurring transaction not found');
    if (existing.userId !== userId) throw new ForbiddenException();
    const updated = await this.prisma.recurringTransaction.update({
      where: { id },
      data: {
        name: dto.name,
        amount: dto.amount,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        notes: dto.notes,
      },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: 'recurring.update', entity: 'recurring_transaction', entityId: id, before: existing as any, after: updated as any },
    });
    return updated;
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.recurringTransaction.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Recurring transaction not found');
    if (existing.userId !== userId) throw new ForbiddenException();
    await this.prisma.auditLog.create({
      data: { userId, action: 'recurring.delete', entity: 'recurring_transaction', entityId: id, before: existing as any },
    });
    return this.prisma.recurringTransaction.delete({ where: { id } });
  }
}
