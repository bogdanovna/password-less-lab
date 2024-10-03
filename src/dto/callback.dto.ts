import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CallbackDto {
  @IsUUID('all')
  code: string;

  @Type(() => RegisterDto)
  @IsOptional()
  @ValidateNested()
  register_data?: RegisterDto;
}
