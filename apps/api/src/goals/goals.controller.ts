import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { GoalsService } from './goals.service';

@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: any) {
    return this.goalsService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { userId: string }) {
    return this.goalsService.findAllForUser(user.userId);
  }

  @Post(':id/contribute')
  contribute(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: { amount: number }) {
    return this.goalsService.contribute(user.userId, id, dto.amount);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.goalsService.remove(user.userId, id);
  }
}
