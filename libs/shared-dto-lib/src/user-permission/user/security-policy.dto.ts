import { IsInt, Min, IsBoolean } from 'class-validator';

export class SecurityPolicyDto {
  @IsInt()
  @Min(5)
  maxLoginAttempts: number;

  @IsInt()
  @Min(5)
  lockoutDurationMinutes: number;

  @IsInt()
  @Min(30)
  sessionTimeoutMinutes: number;

  @IsBoolean()
  enableCaptcha: boolean;
}
