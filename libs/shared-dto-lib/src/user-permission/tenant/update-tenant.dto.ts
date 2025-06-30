import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class UpdateTenantDto {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;
}
