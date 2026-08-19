import { IsEnum, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { AccountType } from '@prisma/client';

export class CreateAccountDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEnum(AccountType)
  type: AccountType;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsInt()
  openingBalance?: number;

  @IsOptional()
  @IsString()
  institution?: string;
}

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  institution?: string;

  @IsOptional()
  isActive?: boolean;
}
