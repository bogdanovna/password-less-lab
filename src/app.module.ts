import {
  Body,
  ForbiddenException,
  Module,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InjectEntityManager, TypeOrmModule } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { AppController } from './app.controller';
import { Config, validateConfig } from './config';
import { CallbackDto } from './dto/callback.dto';
import { SignInDto } from './dto/sign-in.dto';
import { AuthCode } from './models/AuthCode';
import { User } from './models/User';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'dev',
      synchronize: true,
      entities: [User, AuthCode],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateConfig(Config),
    }),
  ],
  controllers: [AppController],
})
export class AppModule {
  constructor(@InjectEntityManager() private db: EntityManager) {}

  @Post('sign-in/email')
  async sign_in_email(@Body() { email }: SignInDto) {
    const auth_code = this.db.create(AuthCode, {
      code: Math.random().toString(36).substring(2),
      payload: JSON.stringify({ email }),
    });

    const [is_user_registered] = await Promise.all([
      this.db.exists(User, { where: { email } }),
      this.db.save(auth_code),
    ]);

    return {
      success: true,
      __dev__: {
        auth_code: auth_code.code,
        scope: is_user_registered ? 'login' : 'register',
      },
    };
  }

  @Post('sign-in/callback')
  async sign_in_callback(@Body() { auth_code, register_data }: CallbackDto) {
    const payload = await this.db.findOne(AuthCode, {
      where: { code: auth_code },
    });

    if (!payload) {
      throw new UnauthorizedException('Invalid auth code');
    }

    const { email } = JSON.parse(payload.payload);
    const user = await this.db.findOne(User, {
      where: { email },
    });

    try {
      if (user) {
        if (register_data) {
          throw new ForbiddenException('User already exists');
        }

        return {
          success: true,
          access_token: `${user.email}-${user.id}`,
        };
      }

      if (!register_data) {
        throw new UnauthorizedException('User should register');
      }

      const newUser = this.db.create(User, { email });

      await this.db.save(newUser);

      return {
        success: true,
        access_token: `${newUser.email}-${newUser.id}`,
      };
    } finally {
      await this.db.delete(AuthCode, { code: auth_code });
    }
  }
}
