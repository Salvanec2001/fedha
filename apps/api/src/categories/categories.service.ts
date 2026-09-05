import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, includeArchived = false) {
    return this.prisma.transactionCategory.findMany({
      where: { userId, ...(includeArchived ? {} : { isArchived: false }) },
      orderBy: { name: 'asc' },
    });
  }

  async create(userId: string, dto: { name: string; group: string; icon?: string; color?: string }) {
    return this.prisma.transactionCategory.create({
      data: {
        userId,
        name: dto.name,
        group: dto.group as any,
        icon: dto.icon,
        color: dto.color,
        isCustom: true,
      },
    });
  }

  async update(userId: string, id: string, dto: { name?: string; icon?: string; color?: string }) {
    const existing = await this.prisma.transactionCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');
    if (existing.userId !== userId) throw new ForbiddenException();
    return this.prisma.transactionCategory.update({
      where: { id },
      data: { name: dto.name, icon: dto.icon, color: dto.color },
    });
  }

  async setArchived(userId: string, id: string, isArchived: boolean) {
    const existing = await this.prisma.transactionCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');
    if (existing.userId !== userId) throw new ForbiddenException();
    return this.prisma.transactionCategory.update({ where: { id }, data: { isArchived } });
  }
}
