import { IsInt, Min } from 'class-validator';

export class SecurityPolicyDto {
  @IsInt()
  @Min(1)
  maxLoginAttempts: number;

  @IsInt()
  @Min(60)
  lockDurationSeconds: number;
}
