import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Config } from './config';

export const GOOGLE_SIGN_IN_STRATEGY = 'google';

@Injectable()
export class GoogleAuthStrategy extends PassportStrategy(
  Strategy,
  GOOGLE_SIGN_IN_STRATEGY,
) {
  constructor(config: ConfigService<Config>) {
    super({
      clientID: config.get('GOOGLE_CLIENT_ID'),
      clientSecret: config.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: 'http://localhost:3000/auth/google/callback',
      scope: ['email'],
    });
  }
  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { emails } = profile;
    const user = {
      email: emails[0].value,
    };
    done(null, user);
  }
}

@Injectable()
export class GoogleOAuthGuard extends AuthGuard(GOOGLE_SIGN_IN_STRATEGY) {}
