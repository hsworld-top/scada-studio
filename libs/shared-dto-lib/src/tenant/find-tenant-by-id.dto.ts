import { IsInt, IsNotEmpty } from 'class-validator';

export class FindTenantByIdDto {
  @IsInt()
  @IsNotEmpty()
  id: number;
}
