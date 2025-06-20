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
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { SsoLoginDto } from './dto/sso-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

/**
 * AuthController 负责处理认证相关的 HTTP 和微服务请求。
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
   * @returns 登录结果，包含 token 或错误信息
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
      throw new UnauthorizedException('Invalid credentials or tenant.');
    }

    // 3. 登录成功后处理
    await this.authService.recordLoginAttempt(loginDto, true);
    const token = this.authService.login(user);
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
   */
  @MessagePattern('auth.refreshToken')
  // 注意：这里没有使用 @UseGuards，因为微服务场景下守卫需要特殊处理。
  // 我们将在 Service 层直接处理 DTO 和 Token 验证。
  // 如果这是 HTTP 接口，我们会用 @UseGuards(AuthGuard('jwt-refresh'))
  async refreshToken(
    @Payload(new ValidationPipe()) refreshTokenDto: RefreshTokenDto,
  ) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
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
    if (token) {
      await this.authService.logout(token);
    }
    return { success: true, message: 'Logout successful' };
  }
}
