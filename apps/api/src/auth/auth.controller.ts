import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { RegisterDto, LoginDto, RefreshDto, VerifyEmailDto, VerifyPhoneDto, UpdatePhoneDto, UpdateProfileDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: { userId: string }) {
    return this.authService.me(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  updateProfile(@CurrentUser() user: { userId: string }, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('phone')
  @HttpCode(HttpStatus.OK)
  updatePhone(@CurrentUser() user: { userId: string }, @Body() dto: UpdatePhoneDto) {
    return this.authService.updatePhone(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('phone/request-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  requestPhoneVerification(@CurrentUser() user: { userId: string }) {
    return this.authService.requestPhoneVerification(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('phone/verify')
  @HttpCode(HttpStatus.OK)
  verifyPhone(@CurrentUser() user: { userId: string }, @Body() dto: VerifyPhoneDto) {
    return this.authService.verifyPhone(user.userId, dto);
  }
}
