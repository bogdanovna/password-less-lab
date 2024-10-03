import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
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
  ],
  controllers: [AppController],
})
export class AppModule {}
