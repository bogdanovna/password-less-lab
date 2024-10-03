import { plainToInstance } from 'class-transformer';
import { IsString, validateSync } from 'class-validator';

export class Config {
  @IsString()
  GOOGLE_CLIENT_ID: string;
  @IsString()
  GOOGLE_CLIENT_SECRET: string;
}

export function validateConfig(Expected: new () => any) {
  return (config: Record<string, unknown> = {}) => {
    const validatedConf = plainToInstance(Expected, config, {
      exposeDefaultValues: true,
    });
    const errors = validateSync(validatedConf);

    if (errors.length) throw new Error(errors.toString());

    return validatedConf;
  };
}
