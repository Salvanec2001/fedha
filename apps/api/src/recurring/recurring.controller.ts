import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { RecurringService } from './recurring.service';

@UseGuards(JwtAuthGuard)
@Controller('recurring')
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: any) {
    return this.recurringService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { userId: string }) {
    return this.recurringService.findAllForUser(user.userId);
  }

  @Patch(':id')
  update(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: any) {
    return this.recurringService.update(user.userId, id, dto);
  }

  @Patch(':id/pause')
  pause(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.recurringService.setActive(user.userId, id, false);
  }

  @Patch(':id/resume')
  resume(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.recurringService.setActive(user.userId, id, true);
  }

  @Post(':id/skip')
  skip(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.recurringService.skipNext(user.userId, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.recurringService.remove(user.userId, id);
  }
}
