import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { DebtsService } from './debts.service';

@UseGuards(JwtAuthGuard)
@Controller('debts')
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: any) {
    return this.debtsService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { userId: string }) {
    return this.debtsService.findAllForUser(user.userId);
  }

  @Patch(':id')
  update(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: any) {
    return this.debtsService.update(user.userId, id, dto);
  }

  @Post(':id/payments')
  addPayment(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: { amount: number; notes?: string }) {
    return this.debtsService.addPayment(user.userId, id, dto.amount, dto.notes);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.debtsService.remove(user.userId, id);
  }
}
