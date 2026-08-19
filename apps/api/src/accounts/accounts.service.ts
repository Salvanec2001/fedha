import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAccountDto) {
    return this.prisma.account.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        currency: dto.currency ?? 'TZS',
        currentBalance: dto.openingBalance ?? 0,
        institution: dto.institution,
      },
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.account.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOneOwned(userId: string, accountId: string) {
    const account = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Account not found');
    if (account.userId !== userId) throw new ForbiddenException();
    return account;
  }

  async update(userId: string, accountId: string, dto: UpdateAccountDto) {
    await this.findOneOwned(userId, accountId);
    return this.prisma.account.update({ where: { id: accountId }, data: dto });
  }

  async deactivate(userId: string, accountId: string) {
    await this.findOneOwned(userId, accountId);
    return this.prisma.account.update({ where: { id: accountId }, data: { isActive: false } });
  }
}
