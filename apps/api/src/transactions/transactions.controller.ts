import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, ListTransactionsQuery } from './dto/transaction.dto';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { userId: string }, @Query() query: ListTransactionsQuery) {
    return this.transactionsService.findAllForUser(user.userId, query);
  }

  @Delete(':id')
  voidTransaction(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.transactionsService.voidTransaction(user.userId, id);
  }
}
