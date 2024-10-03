import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { Config } from './config';

@Injectable()
export class MailerService {
  private readonly transport: Transporter<SMTPTransport.SentMessageInfo>;
  constructor(private configService: ConfigService<Config>) {
    const config = {
      host: configService.get('SMTP_HOST'),
      port: configService.get('SMTP_PORT'),
      secure: false, // TODO
    };
    this.transport = createTransport(config);
  }

  public async sendEmail({
    from,
    to,
    subject,
    html,
    log,
  }: {
    from: string;
    to: string;
    subject: string;
    html: string;
    log?: string;
  }): Promise<void> {
    try {
      await this.transport.sendMail({
        from,
        to,
        subject,
        html,
      });
      if (log) {
        console.debug(log);
      }
    } catch (err: unknown) {
      console.error(err);
    }
  }
}
