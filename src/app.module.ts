import { Body, Module, Post } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InjectEntityManager, TypeOrmModule } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { AppController } from './app.controller';
import { Config, validateConfig } from './config';
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
  async sign_in_email(@Body() body: SignInDto) {
    const auth_code = this.db.create(AuthCode, {
      code: Math.random().toString(36).substring(2),
      payload: JSON.stringify({ email: body.email }),
    });

    await this.db.save(auth_code);

    return {
      success: true,
      __dev__: {
        auth_code: auth_code.code,
      },
    };
  }
}
