import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class UpdateGroupDto {
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

  @IsOptional()
  @IsInt()
  parentId?: number | null;

  @IsInt()
  @IsNotEmpty()
  tenantId: number;
}
