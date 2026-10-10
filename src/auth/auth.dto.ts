import { IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @IsString() @Matches(/^[a-z0-9][a-z0-9._-]{2,63}$/) username!: string;
  @IsString() @Length(12, 128) password!: string;
}
