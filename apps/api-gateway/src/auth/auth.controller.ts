import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Request,
  ValidationPipe,
  Get,
  Param,
  Headers,
  Ip,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { LoginDto, RefreshTokenDto, SsoLoginDto } from '@app/shared-dto-lib';
import { ResponseUtil } from '../common/utils/response.util';
import { ApiResponse } from '../common/interfaces/api-response.interface';

/**
 * 认证控制器 - 处理用户登录、注册、token刷新等认证相关的HTTP请求
 */
@Controller('api/auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  /**
   * 用户登录
   * @param loginDto 登录数据
   * @param ip 客户端IP地址
   * @returns 登录结果，包含token信息
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ValidationPipe()) loginDto: LoginDto,
    @Ip() ip: string,
  ) {
    // 添加客户端IP到请求数据
    loginDto.ip = ip;

    const result = await firstValueFrom(
      this.authClient.send('auth.login', loginDto).pipe(
        timeout(10000), // 10秒超时
        catchError((error) => {
          throw error;
        }),
      ),
    );

    return result;
  }

  /**
   * 单点登录 (SSO)
   * @param ssoLoginDto SSO登录数据
   * @param ip 客户端IP地址
   * @returns 登录结果
   */
  @Post('sso')
  @HttpCode(HttpStatus.OK)
  async ssoLogin(
    @Body(new ValidationPipe()) ssoLoginDto: SsoLoginDto,
    @Ip() ip: string,
  ) {
    const result = await firstValueFrom(
      this.authClient.send('auth.ssoLogin', { ...ssoLoginDto, ip }).pipe(
        timeout(10000),
        catchError((error) => {
          throw error;
        }),
      ),
    );

    return result;
  }

  /**
   * 刷新访问令牌
   * @param refreshTokenDto 刷新令牌数据
   * @param ip 客户端IP地址
   * @returns 新的token信息
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body(new ValidationPipe()) refreshTokenDto: RefreshTokenDto,
    @Ip() ip: string,
  ) {
    const result = await firstValueFrom(
      this.authClient
        .send('auth.refreshToken', { ...refreshTokenDto, ip })
        .pipe(
          timeout(10000),
          catchError((error) => {
            throw error;
          }),
        ),
    );

    return result;
  }

  /**
   * 用户登出
   * @param req 请求对象
   * @param body 请求体，包含sessionId
   * @param ip 客户端IP地址
   * @returns 登出结果
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req: any,
    @Body() body: { sessionId?: string },
    @Ip() ip: string,
  ) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const { sessionId } = body;

      if (!token) {
        return { success: false, message: '缺少认证token' };
      }

      const result = await firstValueFrom(
        this.authClient
          .send('auth.logout', {
            accessToken: token,
            sessionId,
            ip,
          })
          .pipe(
            timeout(10000),
            catchError((error) => {
              throw error;
            }),
          ),
      );

      return { success: true, message: '登出成功' };
    } catch (error) {
      return { success: false, message: '登出失败' };
    }
  }

  /**
   * 获取图形验证码
   * @param captchaId 验证码ID（预留参数，当前每次生成新的验证码）
   * @returns 验证码数据
   */
  @Get('captcha/:captchaId')
  async getCaptcha(@Param('captchaId') captchaId: string) {
    try {
      const result = await firstValueFrom(
        this.authClient.send('auth.generateCaptcha', {}).pipe(
          timeout(5000),
          catchError((error) => {
            throw error;
          }),
        ),
      );

      if (result && result.svg) {
        return {
          success: true,
          data: result.svg,
          captchaId: result.captchaId,
          contentType: 'image/svg+xml',
        };
      } else {
        return { success: false, message: '验证码生成失败' };
      }
    } catch (error) {
      return { success: false, message: '获取验证码失败' };
    }
  }

  /**
   * 获取验证码配置信息
   * @returns 验证码配置
   */
  @Get('captcha-config')
  async getCaptchaConfig() {
    try {
      const result = await firstValueFrom(
        this.authClient.send('auth.getCaptchaConfig', {}).pipe(
          timeout(5000),
          catchError((error) => {
            throw error;
          }),
        ),
      );

      return result;
    } catch (error) {
      return { enabled: false };
    }
  }

  /**
   * 获取当前用户信息
   * @param req 请求对象
   * @returns 用户信息
   */
  @Get('me')
  getCurrentUser(@Request() req: any): ApiResponse {
    return ResponseUtil.success(req.user, '获取用户信息成功');
  }
}
