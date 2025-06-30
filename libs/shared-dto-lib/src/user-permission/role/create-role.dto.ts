import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @IsNotEmpty()
  tenantId: number;

  @IsOptional()
  @IsInt()
  operatorId?: number;
}
