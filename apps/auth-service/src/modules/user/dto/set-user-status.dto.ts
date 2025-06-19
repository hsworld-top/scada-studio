import { IsInt, IsEnum, IsNotEmpty } from 'class-validator';
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
}
