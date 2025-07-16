import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Post,
  Body,
  Request,
  InternalServerErrorException,
  ServiceUnavailableException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from '@app/shared-dto-lib';
import { firstValueFrom, timeout, retry, of, catchError } from 'rxjs';
import { I18nService } from 'nestjs-i18n';
/**
 * 用户管理控制器 - 处理用户创建、更新、删除、查询等用户管理相关的HTTP请求
 */
@Controller('api/users')
export class UserController {
  private readonly logger = new Logger(UserController.name);
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    private readonly i18n: I18nService,
  ) {}

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.authClient.send('users.create', createUserDto);
  }

  @Get()
  async getUsers(@Request() req: any) {
    // try {
    //   const result = await firstValueFrom(
    //     this.authClient.send('users.findAll', {
    //       user: req.user, // 注入用户对象
    //     }),
    //   );
    //   return result;
    // } catch (error) {
    //   throw new Error(error.message);
    // }
    const result = await this.callAuthService(
      'users.findAll',
      {
        user: req.user, // 注入用户对象
      },
      { timeout: 5000, retries: 3, operation: 'getUsers' },
    );
    return result;
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.authClient.send('users.delete', id);
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
