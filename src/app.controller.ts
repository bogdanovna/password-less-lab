import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Response } from 'express';
import { Auth, google } from 'googleapis';
import { EntityManager } from 'typeorm';
import { Config } from './config';
import { CallbackDto } from './dto/callback.dto';
import { SignInDto } from './dto/sign-in.dto';
import { GoogleOAuthGuard } from './google-auth';
import { MailerService } from './mailer.service';
import { AuthCode } from './models/AuthCode';
import { User } from './models/User';

@Controller()
export class AppController {
  private oauthClient: Auth.OAuth2Client;
  constructor(
    @InjectEntityManager() private db: EntityManager,
    private mailerService: MailerService,
    private configService: ConfigService<Config, true>,
  ) {
    this.oauthClient = new google.auth.OAuth2(
      configService.get('GOOGLE_CLIENT_ID'),
      configService.get('GOOGLE_CLIENT_SECRET'),
    );
  }

  @Get()
  async ui() {
    return 'Hello, World! This is a password-less demo. And this page should be a UI... (check query params)';
  }

  @UseGuards(GoogleOAuthGuard)
  @Get('auth/sign-in/google')
  async sign_in_google() {}

  @Post('auth/sign-in/email')
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

  @UseGuards(GoogleOAuthGuard)
  @Get('auth/google/callback')
  async google_callback(@Req() req, @Res() res: Response) {
    const email = req.user?.email;

    if (!email) {
      throw new InternalServerErrorException(
        'No email in the user object from google',
      );
    }

    const auth_code = this.db.create(AuthCode, {
      payload: JSON.stringify({ email }),
    });
    const [is_user_registered] = await Promise.all([
      this.db.exists(User, { where: { email } }),
      this.db.save(auth_code),
    ]);
    const scope = is_user_registered ? 'login' : 'register';

    return res.redirect(
      `http://localhost:3000?auth_code=${auth_code.code},scope=${scope}`,
    );
  }

  @Post('auth/sign-in/callback')
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
