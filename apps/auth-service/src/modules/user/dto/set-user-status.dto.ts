import { IsInt, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { UserStatus } from '../entities/user.entity';

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
