import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;
}
