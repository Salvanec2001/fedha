import { IsDateString, IsEnum, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsDateString()
  occurredAt: string;

  @IsString()
  accountId: string;

  @IsOptional()
  @IsString()
  toAccountId?: string;

  @IsOptional()
  @IsString()
  externalRecipientName?: string;

  @IsOptional()
  @IsString()
  externalRecipientAccountNumber?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  counterparty?: string;
}

export class ListTransactionsQuery {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsString()
  search?: string;
}
