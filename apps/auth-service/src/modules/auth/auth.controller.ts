import {
  Controller,
  Post,
  UseGuards,
  Request,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginDto, SsoLoginDto, RefreshTokenDto } from '@app/shared-dto-lib';
import { AuthGuard } from '@nestjs/passport';
import { I18nService } from 'nestjs-i18n';

/**
 * AuthController 负责处理认证相关的 HTTP 和微服务请求。
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * 生成图形验证码。
   * @returns {Promise<{ captchaId: string, svg: string }>} 验证码ID和SVG图像数据
   */
  @MessagePattern('auth.generateCaptcha')
  async generateCaptcha() {
    return this.authService.generateCaptcha();
  }

  /**
   * 处理微服务的登录消息，校验用户并返回 token。
   * @param loginDto 登录数据传输对象
   * @returns 登录结果，包含 token 或错误信息（普通用户含 sessionId）
   */
  @MessagePattern('auth.login')
  async login(@Payload(new ValidationPipe()) loginDto: LoginDto) {
    // 1. 登录前置校验（失败锁定、验证码）
    await this.authService.preLoginValidate(loginDto);

    // 2. 核心用户身份验证
    const user = await this.authService.validateUser(
      loginDto.tenantSlug,
      loginDto.username,
      loginDto.password,
    );

    if (!user) {
      // 记录登录失败
      await this.authService.recordLoginAttempt(loginDto, false);
      throw new UnauthorizedException(
        this.i18n.t('common.invalid_credentials'),
      );
    }

    // 3. 登录成功后处理
    await this.authService.recordLoginAttempt(loginDto, true);
    // 返回token和sessionId（普通用户）
    const token = await this.authService.login(user);
    return { success: true, data: token };
  }

  /**
   * 处理单点登录 (SSO) 请求。
   * @param ssoLoginDto 包含第三方签发的 SSO Token
   * @returns 登录成功后我们系统自己的 token
   */
  @MessagePattern('auth.ssoLogin')
  async ssoLogin(@Payload(new ValidationPipe()) ssoLoginDto: SsoLoginDto) {
    return this.authService.ssoLogin(ssoLoginDto);
  }

  /**
   * 使用 Refresh Token 获取新的 Access Token。
   * @param refreshTokenDto 包含 refreshToken 和（普通用户）sessionId
   */
  @MessagePattern('auth.refreshToken')
  async refreshToken(
    @Payload(new ValidationPipe()) refreshTokenDto: RefreshTokenDto,
  ) {
    // 普通用户多端登录需带 sessionId
    return this.authService.refreshToken(
      refreshTokenDto.refreshToken,
      refreshTokenDto.sessionId,
    );
  }

  /**
   * 处理 HTTP 的登出请求，将 token 加入黑名单。
   * @param req 请求对象，包含认证 token
   * @returns 登出结果
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async httpLogout(@Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    // sessionId 可通过 header 或 body 传递，这里假设从 body 获取
    const sessionId = req.body?.sessionId;
    if (token) {
      await this.authService.logout(token, sessionId);
    }
    return { success: true, message: 'Logout successful' };
  }
}
