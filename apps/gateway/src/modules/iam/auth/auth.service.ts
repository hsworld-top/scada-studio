import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { LoginDto, LogoutDto, RefreshTokenDto } from '@app/shared-dto-lib';

/**
 * 认证服务
 * @description 转发认证相关请求到IAM服务
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject('IAM_SERVICE') private readonly iamServiceClient: ClientProxy,
  ) {}

  /**
   * 生成验证码
   * @description 调用IAM服务生成验证码
   * @returns 验证码图片
   */
  generateCaptcha() {
    return this.iamServiceClient.send('iam.auth.generateCaptcha', {});
  }

  /**
   * 获取验证码配置信息
   * @description 获取验证码的配置信息
   * @returns 验证码配置信息
   */
  getCaptchaConfig() {
    return this.iamServiceClient.send('iam.auth.getCaptchaConfig', {});
  }

  /**
   * 用户登录
   * @description 调用IAM服务进行用户登录验证
   * @param loginDto 登录信息
   * @returns 登录结果
   */
  login(loginDto: LoginDto) {
    return this.iamServiceClient.send('iam.auth.login', loginDto);
  }

  /**
   * 用户登出
   * @description 调用IAM服务进行用户登出
   * @param logoutDto 登出信息
   * @returns 登出结果
   */
  logout(logoutDto: LogoutDto) {
    return this.iamServiceClient.send('iam.auth.logout', logoutDto);
  }

  /**
   * 刷新令牌
   * @description 调用IAM服务刷新访问令牌
   * @param refreshTokenDto 刷新令牌信息
   * @returns 新的访问令牌
   */
  refreshToken(refreshTokenDto: RefreshTokenDto) {
    return this.iamServiceClient.send('iam.auth.refreshToken', refreshTokenDto);
  }

  /**
   * 验证令牌
   * @description 调用IAM服务验证访问令牌
   * @param body 包含访问令牌的请求体
   * @returns 令牌验证结果
   */
  validateToken(body: { accessToken: string }) {
    return this.iamServiceClient.send('iam.auth.validateToken', body);
  }

  /**
   * 单点登录
   * @description 调用IAM服务进行单点登录（待实现）
   * @returns 单点登录结果
   */
  ssoLogin() {
    return this.iamServiceClient.send('iam.auth.ssoLogin', {});
  }
}
