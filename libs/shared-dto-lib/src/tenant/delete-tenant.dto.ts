import { IsInt, IsNotEmpty } from 'class-validator';

export class DeleteTenantDto {
  @IsInt()
  @IsNotEmpty()
  id: number;
}
