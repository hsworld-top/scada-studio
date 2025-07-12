import {
  Controller,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginDto, SsoLoginDto, RefreshTokenDto } from '@app/shared-dto-lib';
import { I18nService } from 'nestjs-i18n';

/**
 * AuthController 负责处理认证相关的微服务请求。
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
   * 获取验证码配置信息
   * @returns 验证码配置
   */
  @MessagePattern('auth.getCaptchaConfig')
  getCaptchaConfig() {
    const enabled = process.env.ENABLE_CAPTCHA === 'true';
    return {
      enabled,
      ttl: Number(process.env.CAPTCHA_TTL_SECONDS || 300),
    };
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
    const token = await this.authService.login(user, loginDto.ip);
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
   * 处理登出请求
   * @param payload 登出数据
   * @returns 登出结果
   */
  @MessagePattern('auth.logout')
  async logout(
    @Payload()
    payload: {
      accessToken: string;
      sessionId?: string;
      operatorId?: number;
      ip?: string;
    },
  ) {
    try {
      await this.authService.logout(
        payload.accessToken,
        payload.sessionId,
        payload.operatorId,
        payload.ip,
      );
      return { success: true, message: '登出成功' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 验证访问token的有效性（供网关调用）
   * @param payload { token: string }
   * @returns { valid: boolean, user?: any, error?: string }
   */
  @MessagePattern('auth.validateToken')
  async validateToken(@Payload() payload: { token: string }) {
    try {
      const { token } = payload;

      if (!token) {
        return { valid: false, error: 'Token不能为空' };
      }

      // 检查token是否在黑名单中
      const isBlacklisted = await this.authService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return { valid: false, error: 'Token已失效' };
      }

      // 验证token并获取用户信息
      const user = await this.authService.validateAccessToken(token);
      if (!user) {
        return { valid: false, error: '无效的Token' };
      }

      return { valid: true, user };
    } catch (error) {
      return { valid: false, error: error.message || 'Token验证失败' };
    }
  }
}
