import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { CallbackDto } from './dto/callback.dto';
import { SignInDto } from './dto/sign-in.dto';
import { MailerService } from './mailer.service';
import { AuthCode } from './models/AuthCode';
import { User } from './models/User';

@Controller()
export class AppController {
  constructor(
    @InjectEntityManager() private db: EntityManager,
    private mailerService: MailerService,
  ) {}

  @Get()
  async ui() {
    return 'Hello, World! This is a password-less demo. And this page should be a UI... (check query params)';
  }

  @Post('sign-in/email')
  async sign_in_email(@Body() { email }: SignInDto) {
    const auth_code = this.db.create(AuthCode, {
      payload: JSON.stringify({ email }),
    });
    const [is_user_registered] = await Promise.all([
      this.db.exists(User, { where: { email } }),
      this.db.save(auth_code),
    ]);
    const scope = is_user_registered ? 'login' : 'register';
    void this.mailerService
      .sendEmail({
        from: 'demo@password.less',
        to: email,
        subject: scope.charAt(0).toUpperCase() + scope.slice(1),
        html: `Use this <a href="http://localhost:3000?auth_code=${auth_code.code},scope=${scope}">link</a> to ${scope}`,
      })
      .catch(console.error);

    return {
      success: true,
      __dev__: {
        code: auth_code.code,
        scope,
      },
    };
  }

  @Post('sign-in/callback')
  async sign_in_callback(@Body() { code, register_data }: CallbackDto) {
    const payload = await this.db.findOne(AuthCode, {
      where: { code },
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

      const newUser = this.db.create(User, { email, ...register_data });

      await this.db.save(newUser);

      return {
        success: true,
        access_token: `${newUser.email}-${newUser.id}`,
      };
    } finally {
      await this.db.delete(AuthCode, { code: code });
    }
  }
}
