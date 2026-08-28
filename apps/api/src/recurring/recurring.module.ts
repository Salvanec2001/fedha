import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RecurringService } from './recurring.service';
import { RecurringController } from './recurring.controller';
import { RecurringCron } from './recurring.cron';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [ScheduleModule.forRoot(), TransactionsModule],
  controllers: [RecurringController],
  providers: [RecurringService, RecurringCron],
})
export class RecurringModule {}
