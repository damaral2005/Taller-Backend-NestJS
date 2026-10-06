import { IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @IsString() @Matches(/^[a-z0-9][a-z0-9._-]{2,63}$/) username!: string;
  @IsString() @Length(12, 128) password!: string;
}
export class EnrollmentDto {
  @IsString() @Matches(/^[a-f0-9]{64}$/) enrollmentToken!: string;
}
export class ConfirmDto extends EnrollmentDto {
  @IsString() @Matches(/^\d{6}$/) code!: string;
}
export class VerifyDto {
  @IsString() @Matches(/^[a-f0-9]{64}$/) challengeToken!: string;
  @IsString() @Matches(/^\d{6}$/) code!: string;
}
