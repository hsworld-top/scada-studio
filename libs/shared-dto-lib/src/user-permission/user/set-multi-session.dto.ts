import { IsBoolean, IsInt } from 'class-validator';

export class SetMultiSessionDto {
  @IsInt()
  userId: number;

  @IsBoolean()
  allowMultiSession: boolean;
}
