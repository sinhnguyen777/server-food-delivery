import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { Global, Module } from '@nestjs/common';
import { join } from 'path';
import { EmailService } from './email.service';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      useFactory: async () => ({
        // problems can not read .env
        transport: {
          host: 'smtp.gmail.com', // smtp.gmail.com
          secure: true,
          auth: {
            user: 'sinhnguyen.me@gmail.com', // sinhnguyen.me@gmail.com
            pass: 'zrsy bpux zqeh yqhr', // zrsy bpux zqeh yqhr
          },
        },
        defaults: {
          from: 'sinhnguyen',
        },
        template: {
          dir: join(__dirname, '../../../email-templates'),
          adapter: new EjsAdapter(),
          options: {
            strict: false,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
