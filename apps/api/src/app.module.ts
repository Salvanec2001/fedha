import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';
import { BudgetsModule } from './budgets/budgets.module';
import { GoalsModule } from './goals/goals.module';
import { ActivityModule } from './activity/activity.module';
import { CategoriesModule } from './categories/categories.module';
import { DebtsModule } from './debts/debts.module';
import { ReceivablesModule } from './receivables/receivables.module';
import { RecurringModule } from './recurring/recurring.module';
import { AdminModule } from './admin/admin.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    NotificationsModule,
    AuthModule,
    AccountsModule,
    TransactionsModule,
    DashboardModule,
    UsersModule,
    ReportsModule,
    BudgetsModule,
    GoalsModule,
    ActivityModule,
    CategoriesModule,
    DebtsModule,
    ReceivablesModule,
    RecurringModule,
    AdminModule,
    SearchModule,
  ],
})
export class AppModule {}
