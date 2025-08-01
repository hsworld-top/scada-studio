import { Controller, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { LoginDto, LogoutDto, RefreshTokenDto } from '@app/shared-dto-lib';
import { ResponseCode } from '@app/api-response-lib';
import { AppLogger } from '@app/logger-lib';
/**
 * 认证控制器
 * @description 认证控制器是认证服务的核心控制器，用于处理认证相关的请求
 */
@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AuthController.name);
  }
  /**
   * 生成验证码
   * @description 生成验证码，并返回验证码图片
   * @returns 验证码图片
   */
  @MessagePattern('iam.auth.generateCaptcha')
  async generateCaptcha() {
    const captcha = await this.authService.generateCaptcha();
    return {
      code: ResponseCode.SUCCESS,
      data: captcha,
      msg: 'iam.auth.generateCaptcha_success',
    };
  }

  /**
   * 登录
   * @description 登录，并返回登录信息
   * @param payload 登录信息
   * @returns 登录信息
   */
  @MessagePattern('iam.auth.login')
  async login(@Payload(new ValidationPipe()) payload: LoginDto) {
    // 预登录验证
    await this.authService.preLoginValidate(payload);
    // 验证用户
    const user = await this.authService.validateUser(
      payload.tenantId,
      payload.username,
      payload.password,
    );
    // 如果用户不存在，则记录登录失败，并抛出错误
    if (!user) {
      this.authService.recordLoginAttempt(payload, false);
      throw new Error('iam.auth.invalid_credentials');
    }
    // 记录登录成功
    await this.authService.recordLoginAttempt(payload, true);
    const token = await this.authService.login(user);
    if (payload.password === process.env.ADMIN_PASSWORD) {
      return {
        code: ResponseCode.SUCCESS,
        data: { needChangePassword: true },
        msg: 'iam.auth.login_success',
      };
    }
    return {
      code: ResponseCode.SUCCESS,
      data: token,
      msg: 'iam.auth.login_success',
    };
  }
  /**
   * 登出
   * @param payload 登出数据
   * @returns 登出结果
   */
  @MessagePattern('iam.auth.logout')
  async logout(@Payload(new ValidationPipe()) payload: LogoutDto) {
    const refreshTokenDeleted = await this.authService.logout(payload);
    return {
      code: ResponseCode.SUCCESS,
      msg: refreshTokenDeleted
        ? 'iam.auth.logout_success'
        : 'iam.auth.logout_failed',
      data: refreshTokenDeleted,
    };
  }
  /**
   * 验证token
   * @param payload 验证token参数
   * @returns 验证结果
   */
  @MessagePattern('iam.auth.validateToken')
  async validateToken(
    @Payload(new ValidationPipe()) payload: { accessToken: string },
  ) {
    // 检查token是否在黑名单中
    const isBlacklisted = await this.authService.isTokenBlacklisted(
      payload.accessToken,
    );
    if (!isBlacklisted) {
      throw new Error('iam.auth.token_blacklisted');
    }
    // 验证token并获取用户信息
    const userInfo = await this.authService.validateAccessToken(
      payload.accessToken,
    );
    if (!userInfo) {
      throw new Error('iam.auth.invalid_token');
    }
    return {
      code: ResponseCode.SUCCESS,
      msg: 'iam.auth.validateToken_success',
      data: userInfo,
    };
  }
  /**
   * 刷新token
   * @param payload 刷新token参数
   * @returns 刷新token结果
   */
  @MessagePattern('iam.auth.refreshToken')
  async refreshToken(@Payload(new ValidationPipe()) payload: RefreshTokenDto) {
    const newToken = await this.authService.refreshToken(payload);
    return {
      code: ResponseCode.SUCCESS,
      msg: 'iam.auth.refreshToken_success',
      data: newToken,
    };
  }
  /**
   * 获取验证码配置信息
   * @returns 验证码配置信息
   */
  @MessagePattern('iam.auth.getCaptchaConfig')
  getCaptchaConfig() {
    const enabled = process.env.ENABLE_CAPTCHA === 'true';
    const config = {
      enabled,
      ttl: Number(process.env.CAPTCHA_TTL_SECONDS || 300),
    };

    return {
      code: ResponseCode.SUCCESS,
      msg: 'iam.auth.getCaptchaConfig_success',
      data: config,
    };
  }
  //TODO 单点登录
  @MessagePattern('iam.auth.ssoLogin')
  async ssoLogin() {}
}
