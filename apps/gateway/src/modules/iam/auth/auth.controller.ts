import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, LogoutDto, RefreshTokenDto } from '@app/shared-dto-lib';

/**
 * 认证控制器
 * @description 处理认证相关的HTTP请求，转发到IAM服务
 */
@Controller('api/iam')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 生成验证码
   * @description 生成验证码，并返回验证码图片
   * @returns 验证码图片
   */
  @Get('captcha')
  generateCaptcha() {
    return this.authService.generateCaptcha();
  }

  /**
   * 获取验证码配置信息
   * @description 获取验证码的配置信息，如是否启用、过期时间等
   * @returns 验证码配置信息
   */
  @Get('captcha/config')
  getCaptchaConfig() {
    return this.authService.getCaptchaConfig();
  }

  /**
   * 登录
   * @description 用户登录，验证用户凭据并返回访问令牌
   * @param loginDto 登录信息
   * @returns 登录结果，包含访问令牌和刷新令牌
   */
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * 登出
   * @description 用户登出，使当前令牌失效
   * @param logoutDto 登出信息
   * @returns 登出结果
   */
  @Post('logout')
  logout(@Body() logoutDto: LogoutDto) {
    return this.authService.logout(logoutDto);
  }

  /**
   * 刷新令牌
   * @description 使用刷新令牌获取新的访问令牌
   * @param refreshTokenDto 刷新令牌信息
   * @returns 新的访问令牌
   */
  @Post('refresh')
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  /**
   * 验证令牌
   * @description 验证访问令牌的有效性
   * @param body 包含访问令牌的请求体
   * @returns 令牌验证结果
   */
  @Post('validate')
  validateToken(@Body() body: { accessToken: string }) {
    return this.authService.validateToken(body);
  }

  /**
   * 单点登录
   * @description 单点登录接口（待实现）
   * @returns 单点登录结果
   */
  @Post('sso')
  ssoLogin() {
    return this.authService.ssoLogin();
  }
}
