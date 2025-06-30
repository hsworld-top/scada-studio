import { IsString, Length } from 'class-validator';

export class UsernameBlacklistDto {
  @IsString()
  @Length(2, 100)
  username: string;
}
