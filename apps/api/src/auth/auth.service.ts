import { ConflictException, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto, LoginDto, RefreshDto, VerifyPhoneDto, UpdatePhoneDto } from './dto/auth.dto';
import { DEFAULT_CATEGORIES } from '../../prisma/seed';

const BCRYPT_ROUNDS = 12;
const EMAIL_TOKEN_TTL_HOURS = 24;
const PHONE_CODE_TTL_MINUTES = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly notifications: NotificationsService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + EMAIL_TOKEN_TTL_HOURS * 60 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        primaryCurrency: dto.primaryCurrency ?? 'TZS',
        phone: dto.phone,
        emailVerificationToken,
        emailVerificationExpires,
      },
    });

    await this.prisma.transactionCategory.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({
        userId: user.id,
        name: c.name,
        group: c.group as any,
      })),
    });

    const verifyUrl = `${process.env.WEB_ORIGIN}/verify-email?token=${emailVerificationToken}`;
    this.notifications
      .sendEmail(
        user.id,
        user.email,
        'email_verification',
        'Verify your Fedha account',
        `Hi ${user.name},\n\nWelcome to Fedha. Please verify your email by opening this link:\n${verifyUrl}\n\nThis link expires in ${EMAIL_TOKEN_TTL_HOURS} hours.`,
      )
      .catch(() => {});

    return this.issueTokens(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueTokens(user.id, user.email);
  }

  async refresh(dto: RefreshDto) {
    let payload: { sub: string; email: string };
    try {
      payload = this.jwt.verify(dto.refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired, please log in again');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('Account no longer exists');
    }

    return this.issueTokens(user.id, user.email);
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({ where: { emailVerificationToken: token } });
    if (!user || !user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      throw new BadRequestException('Verification link is invalid or has expired');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerificationToken: null, emailVerificationExpires: null },
    });

    return { verified: true };
  }

  async requestPhoneVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (!user.phone) throw new BadRequestException('Add a phone number to your profile first');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + PHONE_CODE_TTL_MINUTES * 60 * 1000);

    await this.prisma.user.update({
      where: { id: userId },
      data: { phoneVerificationCode: code, phoneVerificationExpires: expires },
    });

    await this.notifications.sendSms(
      userId,
      user.phone,
      'phone_verification',
      `Your Fedha verification code is ${code}. It expires in ${PHONE_CODE_TTL_MINUTES} minutes.`,
    );

    return { sent: true };
  }

  async verifyPhone(userId: string, dto: VerifyPhoneDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (
      !user.phoneVerificationCode ||
      user.phoneVerificationCode !== dto.code ||
      !user.phoneVerificationExpires ||
      user.phoneVerificationExpires < new Date()
    ) {
      throw new BadRequestException('Verification code is invalid or has expired');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { phoneVerified: true, phoneVerificationCode: null, phoneVerificationExpires: null },
    });

    return { verified: true };
  }

  async updatePhone(userId: string, dto: UpdatePhoneDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { phone: dto.phone, phoneVerified: false },
      select: { id: true, phone: true, phoneVerified: true },
    });
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        primaryCurrency: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  private issueTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
    });
    return { accessToken, refreshToken, user: { id: userId, email } };
  }
}
