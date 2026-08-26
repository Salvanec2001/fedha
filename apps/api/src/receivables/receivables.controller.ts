import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { ReceivablesService } from './receivables.service';

@UseGuards(JwtAuthGuard)
@Controller('receivables')
export class ReceivablesController {
  constructor(private readonly receivablesService: ReceivablesService) {}

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: any) {
    return this.receivablesService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { userId: string }) {
    return this.receivablesService.findAllForUser(user.userId);
  }

  @Patch(':id')
  update(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: any) {
    return this.receivablesService.update(user.userId, id, dto);
  }

  @Post(':id/payments')
  addPayment(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: { amount: number; notes?: string }) {
    return this.receivablesService.addPayment(user.userId, id, dto.amount, dto.notes);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.receivablesService.remove(user.userId, id);
  }
}
