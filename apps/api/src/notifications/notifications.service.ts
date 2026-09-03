import { Injectable, Logger } from '@nestjs/common';
import { Twilio } from 'twilio';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private twilioClient: Twilio | null = null;

  constructor(private readonly prisma: PrismaService) {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }
  }

  async sendEmail(userId: string, to: string, type: string, subject: string, message: string) {
    const record = await this.prisma.notification.create({
      data: { userId, channel: 'EMAIL', type, recipient: to, subject, message, status: 'PENDING' },
    });

    if (!process.env.RESEND_API_KEY) {
      await this.prisma.notification.update({
        where: { id: record.id },
        data: { status: 'SKIPPED', error: 'Email not configured yet (RESEND_API_KEY missing)' },
      });
      return;
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? 'Fedha <onboarding@resend.dev>',
          to: [to],
          subject,
          text: message,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Resend API error (${res.status}): ${body}`);
      }

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
