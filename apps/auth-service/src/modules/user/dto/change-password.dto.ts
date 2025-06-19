import { IsString, IsNotEmpty, MinLength, IsInt } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;

  @IsInt()
  @IsNotEmpty()
  currentUserId: number;

  @IsInt()
  @IsNotEmpty()
  tenantId: number;
}
