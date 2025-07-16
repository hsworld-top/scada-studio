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
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
  ServiceUnavailableException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import {
  firstValueFrom,
  timeout,
  catchError,
  of,
  retry,
  throwError,
} from 'rxjs';
import { LoginDto, RefreshTokenDto, SsoLoginDto } from '@app/shared-dto-lib';
import { ResponseUtil } from '../common/utils/response.util';
import { CryptoUtil } from '../common/utils/crypto.util';
import { ApiResponse } from '../common/interfaces/api-response.interface';

/**
 * 认证控制器 - 处理用户登录、注册、token刷新等认证相关的HTTP请求
 */
@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    private readonly cryptoUtil: CryptoUtil,
    private readonly i18n: I18nService,
    private readonly responseUtil: ResponseUtil,
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

    try {
      // 解密密码
      if (loginDto.keyId) {
        loginDto.password = this.cryptoUtil.decryptPassword(
          loginDto.keyId,
          loginDto.password,
        );
      }
    } catch (error) {
      this.logger.warn(`密码解密失败 - IP: ${ip}, keyId: ${loginDto.keyId}`);
      const msg = this.i18n.t('gateway.password_decrypt_failed');
      throw new BadRequestException(msg);
    }

    try {
      const result = await this.callAuthService('auth.login', loginDto, {
        timeout: 5000,
        retries: 2,
        operation: '用户登录',
      });

      // 检查微服务返回的结果格式，直接返回auth-service的响应
      if (result && typeof result === 'object' && 'code' in result) {
        return result;
      }

      // 兜底处理 - 这是网关自己的错误
      this.logger.error(`登录返回格式异常 - IP: ${ip}, result:`, result);
      const msg = this.i18n.t('gateway.login_failed');
      throw new InternalServerErrorException(msg);
    } catch (error) {
      // 如果是网关自己抛出的异常，继续抛出
      if (error instanceof HttpException) {
        throw error;
      }

      // 网关层面的系统异常
      this.logger.error(`登录异常 - IP: ${ip}:`, error);
      throw new InternalServerErrorException(
        this.i18n.t('gateway.login_failed'),
      );
    }
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
    try {
      const result = await this.callAuthService(
        'auth.ssoLogin',
        { ...ssoLoginDto, ip },
        {
          timeout: 5000,
          retries: 1,
          operation: 'SSO登录',
        },
      );

      // 检查微服务返回的结果，直接返回auth-service的响应
      if (result && typeof result === 'object' && 'code' in result) {
        return result;
      }

      // 兜底处理 - 这是网关自己的错误
      this.logger.error(`SSO登录返回格式异常 - IP: ${ip}, result:`, result);
      const msg = this.i18n.t('gateway.sso_login_failed');
      throw new InternalServerErrorException(msg);
    } catch (error) {
      // 如果是网关自己抛出的异常，继续抛出
      if (error instanceof HttpException) {
        throw error;
      }

      // 网关层面的系统异常
      this.logger.error(`SSO登录异常 - IP: ${ip}:`, error);
      throw new InternalServerErrorException(
        this.i18n.t('gateway.sso_login_failed'),
      );
    }
  }

  /**
   * 获取RSA公钥（供前端加密密码使用）
   * @returns RSA公钥和密钥标识
   */
  @Get('public-key')
  @HttpCode(HttpStatus.OK)
  async getPublicKey() {
    try {
      const keyInfo = this.cryptoUtil.generateKeyPair();
      return this.responseUtil.success(
        {
          keyId: keyInfo.keyId,
          publicKey: keyInfo.publicKey,
          expiresIn: keyInfo.expiresIn,
          algorithm: 'RSA-OAEP',
          keySize: 2048,
          hash: 'SHA-256',
          usage: '前端密码加密专用，登录时需同时传递keyId和加密密码',
        },
        'gateway.public_key_success',
      );
    } catch (error) {
      this.logger.error('生成公钥失败:', error);
      const msg = this.i18n.t('gateway.service_unavailable');
      throw new InternalServerErrorException(msg);
    }
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
    try {
      const result = await this.callAuthService(
        'auth.refreshToken',
        { ...refreshTokenDto, ip },
        {
          timeout: 5000,
          retries: 1,
          operation: 'Token刷新',
        },
      );

      // 检查微服务返回的结果，直接返回auth-service的响应
      if (result && typeof result === 'object' && 'code' in result) {
        return result;
      }

      // 兜底处理 - 这是网关自己的错误
      this.logger.error(`Token刷新返回格式异常 - IP: ${ip}, result:`, result);
      const msg = this.i18n.t('gateway.token_refresh_failed');
      throw new InternalServerErrorException(msg);
    } catch (error) {
      // 如果是网关自己抛出的异常，继续抛出
      if (error instanceof HttpException) {
        throw error;
      }

      // 网关层面的系统异常
      this.logger.error(`Token刷新异常 - IP: ${ip}:`, error);
      throw new InternalServerErrorException(
        this.i18n.t('gateway.token_refresh_failed'),
      );
    }
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
    const { sessionId, access_token: token } = req.user;

    if (!token) {
      const msg = this.i18n.t('gateway.missing_auth_token');
      throw new BadRequestException(msg);
    }

    try {
      const result = await this.callAuthService(
        'auth.logout',
        {
          accessToken: token,
          sessionId,
          ip,
        },
        {
          timeout: 5000,
          retries: 1,
          operation: '用户登出',
        },
      );

      // 检查微服务返回的结果，直接返回auth-service的响应
      if (result && typeof result === 'object' && 'code' in result) {
        return result;
      }

      // 兜底处理 - 这是网关自己的错误
      this.logger.error(`登出返回格式异常 - IP: ${ip}, result:`, result);
      const msg = this.i18n.t('gateway.logout_failed');
      throw new InternalServerErrorException(msg);
    } catch (error) {
      // 如果是网关自己抛出的异常，继续抛出
      if (error instanceof HttpException) {
        throw error;
      }

      // 网关层面的系统异常
      this.logger.error(`登出异常 - IP: ${ip}:`, error);
      throw new InternalServerErrorException(
        this.i18n.t('gateway.logout_failed'),
      );
    }
  }

  /**
   * 获取图形验证码
   * @returns 验证码数据
   */
  @Get('captcha')
  async getCaptcha() {
    try {
      const result = await this.callAuthService(
        'auth.generateCaptcha',
        {},
        {
          timeout: 5000,
          retries: 1,
          operation: '获取验证码',
        },
      );

      // 检查微服务返回的结果，直接返回auth-service的响应
      if (result && typeof result === 'object' && 'captchaId ' in result) {
        return result;
      }

      // 兜底处理 - 这是网关自己的错误
      this.logger.error('验证码返回格式异常, result:', result);
      const msg = this.i18n.t('gateway.captcha_generation_failed');
      throw new InternalServerErrorException(msg);
    } catch (error) {
      // 如果是网关自己抛出的异常，继续抛出
      if (error instanceof HttpException) {
        throw error;
      }

      // 网关层面的系统异常
      this.logger.error('验证码生成异常:', error);
      throw new InternalServerErrorException(
        this.i18n.t('gateway.captcha_generation_failed'),
      );
    }
  }

  /**
   * 获取验证码配置信息
   * @returns 验证码配置
   */
  @Get('captcha-config')
  async getCaptchaConfig() {
    try {
      const result = await this.callAuthService(
        'auth.getCaptchaConfig',
        {},
        {
          timeout: 5000,
          retries: 1,
          operation: '获取验证码配置',
        },
      );

      // 检查微服务返回的结果，直接返回auth-service的响应
      if (result && typeof result === 'object' && 'code' in result) {
        return result;
      }

      // 兜底处理 - 这是网关自己的错误
      this.logger.error('验证码配置返回格式异常, result:', result);
      const msg = this.i18n.t('gateway.service_error');
      throw new InternalServerErrorException(msg);
    } catch (error) {
      // 如果是网关自己抛出的异常，继续抛出
      if (error instanceof HttpException) {
        throw error;
      }

      // 网关层面的系统异常
      this.logger.error('获取验证码配置异常:', error);
      throw new InternalServerErrorException(
        this.i18n.t('gateway.service_error'),
      );
    }
  }

  /**
   * 获取当前用户信息
   * @param req 请求对象
   * @returns 用户信息
   */
  @Get('me')
  async getCurrentUser(@Request() req: any): Promise<ApiResponse> {
    return await this.responseUtil.success(req.user, 'get_user_info_success');
  }

  /**
   * 调用认证服务的通用方法
   * @private
   */
  private async callAuthService(
    pattern: string,
    data: any,
    options: { timeout: number; retries: number; operation: string },
  ) {
    return await firstValueFrom(
      this.authClient.send(pattern, data).pipe(
        timeout(options.timeout),
        retry({
          count: options.retries,
          delay: (error, retryIndex) => {
            this.logger.warn(
              `${options.operation}失败，第${retryIndex}次重试: ${error.message}`,
            );
            return of(null).pipe(timeout(1000)); // 1秒后重试
          },
        }),
        catchError((error) => {
          // 网络或系统级错误的详细分类
          if (error.name === 'TimeoutError') {
            this.logger.error(
              `${options.operation}超时 - 超时时间: ${options.timeout}ms`,
            );
            throw new ServiceUnavailableException(
              this.i18n.t('gateway.auth_service_timeout'),
            );
          }

          if (error.code === 'ECONNREFUSED') {
            this.logger.error(
              `${options.operation}连接被拒绝 - Auth服务可能未启动`,
            );
            throw new ServiceUnavailableException(
              this.i18n.t('gateway.auth_service_unavailable'),
            );
          }

          if (error.code === 'ENOTFOUND') {
            this.logger.error(`${options.operation}服务地址解析失败`);
            throw new ServiceUnavailableException(
              this.i18n.t('gateway.auth_service_dns_error'),
            );
          }

          this.logger.error(`${options.operation}服务调用失败:`, error);
          throw new InternalServerErrorException(
            this.i18n.t('gateway.service_error'),
          );
        }),
      ),
    );
  }
}
