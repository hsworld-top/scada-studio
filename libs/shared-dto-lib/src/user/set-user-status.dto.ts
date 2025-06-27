import { IsInt, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { UserStatus } from './user-status.enum';

export class SetUserStatusDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsEnum(UserStatus)
  @IsNotEmpty()
  status: UserStatus;

  @IsInt()
  @IsNotEmpty()
  tenantId: number;

  @IsOptional()
  @IsInt()
  operatorId?: number;
}
