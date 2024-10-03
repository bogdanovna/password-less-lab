import { Type } from 'class-transformer';
import { IsEmail, IsOptional, IsUUID, ValidateNested } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;
}

export class CallbackDto {
  @IsUUID('all')
  auth_code: string;

  @Type(() => RegisterDto)
  @IsOptional()
  @ValidateNested()
  register_data?: RegisterDto;
}
