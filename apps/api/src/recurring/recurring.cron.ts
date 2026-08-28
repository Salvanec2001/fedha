import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';

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
export class RecurringCron {
  private readonly logger = new Logger(RecurringCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async generateDueTransactions() {
    const now = new Date();
    const due = await this.prisma.recurringTransaction.findMany({
      where: {
        isActive: true,
        nextRunAt: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
    });

    for (const r of due) {
      try {
        await this.transactions.create(r.userId, {
          type: r.type as any,
          amount: r.amount,
          accountId: r.accountId,
          categoryId: r.categoryId ?? undefined,
          occurredAt: r.nextRunAt.toISOString(),
          description: r.name,
        } as any);

        await this.prisma.transaction.updateMany({
          where: { accountId: r.accountId, description: r.name, occurredAt: r.nextRunAt },
          data: { isRecurringInstance: true },
        });

        await this.prisma.recurringTransaction.update({
          where: { id: r.id },
          data: { nextRunAt: advance(r.nextRunAt, r.frequency) },
        });
      } catch (err: any) {
        this.logger.error(`Failed to generate recurring transaction ${r.id}: ${err.message}`);
      }
    }

    if (due.length > 0) {
      this.logger.log(`Generated ${due.length} recurring transaction(s).`);
    }
  }
}
