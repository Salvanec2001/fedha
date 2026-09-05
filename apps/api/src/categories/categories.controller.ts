import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { CategoriesService } from './categories.service';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(@CurrentUser() user: { userId: string }, @Query('includeArchived') includeArchived?: string) {
    return this.categoriesService.findAll(user.userId, includeArchived === 'true');
  }

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: any) {
    return this.categoriesService.create(user.userId, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: any) {
    return this.categoriesService.update(user.userId, id, dto);
  }

  @Patch(':id/archive')
  archive(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.categoriesService.setArchived(user.userId, id, true);
  }

  @Patch(':id/unarchive')
  unarchive(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.categoriesService.setArchived(user.userId, id, false);
  }
}
