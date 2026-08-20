import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Twilio } from 'twilio';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter | null = null;
  private twilioClient: Twilio | null = null;

  constructor(private readonly prisma: PrismaService) {
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });
    }

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }
  }

  async sendEmail(userId: string, to: string, type: string, subject: string, message: string) {
    const record = await this.prisma.notification.create({
      data: { userId, channel: 'EMAIL', type, recipient: to, subject, message, status: 'PENDING' },
    });

    if (!this.transporter) {
      await this.prisma.notification.update({
        where: { id: record.id },
        data: { status: 'SKIPPED', error: 'Email not configured yet (GMAIL_USER/GMAIL_APP_PASSWORD missing)' },
      });
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `Fedha <${process.env.GMAIL_USER}>`,
        to,
        subject,
        text: message,
      });
      await this.prisma.notification.update({
        where: { id: record.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } catch (err: any) {
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
      await this.prisma.notification.update({
        where: { id: record.id },
        data: { status: 'FAILED', error: err.message },
      });
    }
  }

  async sendSms(userId: string, to: string, type: string, message: string) {
    const record = await this.prisma.notification.create({
      data: { userId, channel: 'SMS', type, recipient: to, message, status: 'PENDING' },
    });

    if (!this.twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
      await this.prisma.notification.update({
        where: { id: record.id },
        data: { status: 'SKIPPED', error: 'SMS not configured yet (TWILIO_* env vars missing)' },
      });
      return;
    }

    try {
      await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      });
      await this.prisma.notification.update({
        where: { id: record.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } catch (err: any) {
      this.logger.error(`Failed to send SMS to ${to}: ${err.message}`);
      await this.prisma.notification.update({
        where: { id: record.id },
        data: { status: 'FAILED', error: err.message },
      });
    }
  }
}
