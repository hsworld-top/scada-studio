import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class UpdateRoleDto {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @IsNotEmpty()
  tenantId: number;
}
