import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { Config, validateConfig } from './config';
import { GoogleAuthStrategy } from './google-auth';
import { MailerService } from './mailer.service';
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
  providers: [MailerService, GoogleAuthStrategy],
  controllers: [AppController],
})
export class AppModule {}
