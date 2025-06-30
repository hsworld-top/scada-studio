import { IsInt, IsNotEmpty, IsEnum } from 'class-validator';
import { TenantStatus } from './tenant-status.enum';

export class ChangeTenantStatusDto {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsEnum(TenantStatus)
  @IsNotEmpty()
  status: TenantStatus;
}
