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
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { LoginDto, RefreshTokenDto, SsoLoginDto } from '@app/shared-dto-lib';
import { ResponseUtil } from '../common/utils/response.util';
import { CryptoUtil } from '../common/utils/crypto.util';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { ERROR_MESSAGES } from '../common/constants/error-messages';

/**
 * 认证控制器 - 处理用户登录、注册、token刷新等认证相关的HTTP请求
 */
@Controller('api/auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    private readonly cryptoUtil: CryptoUtil,
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

    // 如果传入了keyId，则使用新的加密方式解密密码
    if (loginDto.keyId && this.cryptoUtil.hasKeyId(loginDto.keyId)) {
      try {
        loginDto.password = this.cryptoUtil.decryptPassword(
          loginDto.keyId,
          loginDto.password,
        );
      } catch (error) {
        throw new BadRequestException('密码解密失败，请重新获取公钥后重试');
      }
    }
    // 如果没有keyId，保持原样（兼容旧版本客户端）

    const result = await firstValueFrom(
      this.authClient.send('auth.login', loginDto).pipe(
        timeout(10000), // 10秒超时
        catchError((error) => {
          // 网络或系统级错误
          throw new InternalServerErrorException(
            ERROR_MESSAGES.SERVICE_UNAVAILABLE,
          );
        }),
      ),
    );

    // 检查微服务返回的结果格式
    if (result && typeof result === 'object' && 'code' in result) {
      // 如果返回了错误码，转换为HTTP异常
      if (result.code !== 0) {
        this.throwHttpException(result.code, result.msg);
      }

      // 成功时返回原格式（保持{code: 0, msg: 'xxx', data: {...}}格式）
      return result;
    }

    // 兜底处理
    throw new InternalServerErrorException(ERROR_MESSAGES.LOGIN_FAILED);
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
          throw new InternalServerErrorException(
            ERROR_MESSAGES.SSO_SERVICE_UNAVAILABLE,
          );
        }),
      ),
    );

    // 检查微服务返回的结果
    if (result && typeof result === 'object' && 'code' in result) {
      if (result.code !== 0) {
        this.throwHttpException(result.code, result.msg);
      }
      return result;
    }

    throw new InternalServerErrorException(ERROR_MESSAGES.SSO_LOGIN_FAILED);
  }

  /**
   * 获取RSA公钥（供前端加密密码使用）
   * @returns RSA公钥和密钥标识
   */
  @Get('public-key')
  @HttpCode(HttpStatus.OK)
  getPublicKey() {
    try {
      const keyInfo = this.cryptoUtil.generateKeyPair();
      return ResponseUtil.success(
        {
          keyId: keyInfo.keyId,
          publicKey: keyInfo.publicKey,
          expiresIn: keyInfo.expiresIn,
          algorithm: 'RSA-OAEP',
          keySize: 2048,
          hash: 'SHA-256',
          usage: '前端密码加密专用，登录时需同时传递keyId和加密密码',
        },
        '公钥获取成功',
      );
    } catch (error) {
      throw new InternalServerErrorException(
        ERROR_MESSAGES.SERVICE_UNAVAILABLE,
      );
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
    const result = await firstValueFrom(
      this.authClient
        .send('auth.refreshToken', { ...refreshTokenDto, ip })
        .pipe(
          timeout(10000),
          catchError((error) => {
            throw new InternalServerErrorException(
              ERROR_MESSAGES.TOKEN_REFRESH_SERVICE_UNAVAILABLE,
            );
          }),
        ),
    );

    // 检查微服务返回的结果
    if (result && typeof result === 'object' && 'code' in result) {
      if (result.code !== 0) {
        this.throwHttpException(result.code, result.msg);
      }
      return result;
    }

    throw new InternalServerErrorException(ERROR_MESSAGES.TOKEN_REFRESH_FAILED);
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
    const token = req.headers.authorization?.split(' ')[1];
    const { sessionId } = body;

    if (!token) {
      throw new BadRequestException(ERROR_MESSAGES.MISSING_AUTH_TOKEN);
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
            throw new InternalServerErrorException(
              ERROR_MESSAGES.LOGOUT_SERVICE_UNAVAILABLE,
            );
          }),
        ),
    );

    // 检查微服务返回的结果
    if (result && typeof result === 'object' && 'code' in result) {
      if (result.code !== 0) {
        this.throwHttpException(result.code, result.msg);
      }
      return result;
    }

    throw new InternalServerErrorException(ERROR_MESSAGES.LOGOUT_FAILED);
  }

  /**
   * 获取图形验证码
   * @param captchaId 验证码ID（预留参数，当前每次生成新的验证码）
   * @returns 验证码数据
   */
  @Get('captcha/:captchaId')
  async getCaptcha(@Param('captchaId') captchaId: string) {
    const result = await firstValueFrom(
      this.authClient.send('auth.generateCaptcha', {}).pipe(
        timeout(5000),
        catchError((error) => {
          throw new InternalServerErrorException(
            ERROR_MESSAGES.CAPTCHA_SERVICE_UNAVAILABLE,
          );
        }),
      ),
    );

    // 对于验证码接口，我们需要保持原有的响应格式兼容性
    if (result && result.svg) {
      return {
        success: true,
        data: result.svg,
        captchaId: result.captchaId,
        contentType: 'image/svg+xml',
      };
    } else {
      throw new InternalServerErrorException(
        ERROR_MESSAGES.CAPTCHA_GENERATION_FAILED,
      );
    }
  }

  /**
   * 获取验证码配置信息
   * @returns 验证码配置
   */
  @Get('captcha-config')
  async getCaptchaConfig() {
    const result = await firstValueFrom(
      this.authClient.send('auth.getCaptchaConfig', {}).pipe(
        timeout(5000),
        catchError((error) => {
          // 验证码配置获取失败时返回默认配置
          return of({ enabled: false });
        }),
      ),
    );

    return result;
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

  /**
   * 根据错误码抛出相应的HTTP异常
   */
  private throwHttpException(code: number, message: string): never {
    switch (code) {
      case 400:
        throw new BadRequestException(message);
      case 401:
        throw new UnauthorizedException(message);
      case 403:
        throw new ForbiddenException(message);
      case 404:
        throw new NotFoundException(message);
      case 429:
        throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
      case 500:
        throw new InternalServerErrorException(message);
      case 503:
        throw new ServiceUnavailableException(message);
      default:
        // 对于其他4xx错误，统一使用BadRequestException
        if (code >= 400 && code < 500) {
          throw new BadRequestException(message);
        }
        // 对于其他5xx错误，统一使用InternalServerErrorException
        throw new InternalServerErrorException(message);
    }
  }
}
