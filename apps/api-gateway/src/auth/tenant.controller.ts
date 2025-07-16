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
  Put,
  Delete,
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
import {
  CreateTenantDto,
  UpdateTenantDto,
  DeleteTenantDto,
  FindTenantByIdDto,
  ChangeTenantStatusDto,
} from '@app/shared-dto-lib';
import { ResponseUtil } from '../common/utils/response.util';
import { ApiResponse } from '../common/interfaces/api-response.interface';

/**
 * 租户管理控制器 - 处理租户创建、更新、删除、查询等租户管理相关的HTTP请求
 */
@Controller('api/tenants')
export class TenantController {
  private readonly logger = new Logger(TenantController.name);

  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    private readonly i18n: I18nService,
    private readonly responseUtil: ResponseUtil,
  ) {}

  /**
   * 创建租户
   * @param createTenantDto 创建租户数据，包含租户名称和标识符
   * @param req 请求对象，包含用户信息
   * @param ip 客户端IP地址
   * @returns 创建结果，包含租户信息
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTenant(
    @Body(new ValidationPipe()) createTenantDto: CreateTenantDto,
    @Request() req: any,
    @Ip() ip: string,
  ) {
    try {
      const result = await this.callAuthService(
        'tenant.create',
        {
          ...createTenantDto,
          user: req.user, // 注入用户对象
        },
        {
          timeout: 5000,
          retries: 2,
          operation: '创建租户',
        },
      );

      // 检查微服务返回的结果格式，直接返回auth-service的响应
      if (result && typeof result === 'object' && 'code' in result) {
        return result;
      }

      // 兜底处理 - 这是网关自己的错误
      this.logger.error(`创建租户返回格式异常 - IP: ${ip}, result:`, result);
      const msg = this.i18n.t('gateway.tenant_create_failed');
      throw new InternalServerErrorException(msg);
    } catch (error) {
      // 如果是网关自己抛出的异常，继续抛出
      if (error instanceof HttpException) {
        throw error;
      }

      // 网关层面的系统异常
      this.logger.error(`创建租户异常 - IP: ${ip}:`, error);
      throw new InternalServerErrorException(
        this.i18n.t('gateway.tenant_create_failed'),
      );
    }
  }

  /**
   * 更新租户信息
   * @param updateTenantDto 更新租户数据，包含租户ID、名称和标识符
   * @param req 请求对象，包含用户信息
   * @param ip 客户端IP地址
   * @returns 更新结果，包含更新后的租户信息
   */
  @Put()
  @HttpCode(HttpStatus.OK)
  async updateTenant(
    @Body(new ValidationPipe()) updateTenantDto: UpdateTenantDto,
    @Request() req: any,
    @Ip() ip: string,
  ) {
    try {
      const result = await this.callAuthService(
        'tenant.update',
        {
          ...updateTenantDto,
          user: req.user, // 注入用户对象
        },
        {
          timeout: 5000,
          retries: 2,
          operation: '更新租户',
        },
      );

      // 检查微服务返回的结果格式，直接返回auth-service的响应
      if (result && typeof result === 'object' && 'code' in result) {
        return result;
      }

      // 兜底处理 - 这是网关自己的错误
      this.logger.error(`更新租户返回格式异常 - IP: ${ip}, result:`, result);
      const msg = this.i18n.t('gateway.tenant_update_failed');
      throw new InternalServerErrorException(msg);
    } catch (error) {
      // 如果是网关自己抛出的异常，继续抛出
      if (error instanceof HttpException) {
        throw error;
      }

      // 网关层面的系统异常
      this.logger.error(`更新租户异常 - IP: ${ip}:`, error);
      throw new InternalServerErrorException(
        this.i18n.t('gateway.tenant_update_failed'),
      );
    }
  }

  /**
   * 删除租户
   * @param id 租户ID
   * @param req 请求对象，包含用户信息
   * @param ip 客户端IP地址
   * @returns 删除结果
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteTenant(
    @Param('id') id: string,
    @Request() req: any,
    @Ip() ip: string,
  ) {
    // 参数验证
    const tenantId = parseInt(id, 10);
    if (isNaN(tenantId)) {
      const msg = this.i18n.t('gateway.invalid_tenant_id');
      throw new BadRequestException(msg);
    }

    try {
      const result = await this.callAuthService(
        'tenant.delete',
        {
          id: tenantId,
          user: req.user, // 注入用户对象
        },
        {
          timeout: 5000,
          retries: 2,
          operation: '删除租户',
        },
      );

      // 检查微服务返回的结果格式，直接返回auth-service的响应
      if (result && typeof result === 'object' && 'code' in result) {
        return result;
      }

      // 兜底处理 - 这是网关自己的错误
      this.logger.error(`删除租户返回格式异常 - IP: ${ip}, result:`, result);
      const msg = this.i18n.t('gateway.tenant_delete_failed');
      throw new InternalServerErrorException(msg);
    } catch (error) {
      // 如果是网关自己抛出的异常，继续抛出
      if (error instanceof HttpException) {
        throw error;
      }

      // 网关层面的系统异常
      this.logger.error(`删除租户异常 - IP: ${ip}:`, error);
      throw new InternalServerErrorException(
        this.i18n.t('gateway.tenant_delete_failed'),
      );
    }
  }

  /**
   * 根据ID查询租户信息
   * @param id 租户ID
   * @param req 请求对象，包含用户信息
   * @param ip 客户端IP地址
   * @returns 租户信息
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getTenantById(
    @Param('id') id: string,
    @Request() req: any,
    @Ip() ip: string,
  ) {
    // 参数验证
    const tenantId = parseInt(id, 10);
    if (isNaN(tenantId)) {
      const msg = this.i18n.t('gateway.invalid_tenant_id');
      throw new BadRequestException(msg);
    }

    try {
      const result = await this.callAuthService(
        'tenant.findById',
        {
          id: tenantId,
          user: req.user, // 注入用户对象
        },
        {
          timeout: 5000,
          retries: 2,
          operation: '查询租户',
        },
      );

      // 检查微服务返回的结果格式，直接返回auth-service的响应
      if (result && typeof result === 'object' && 'code' in result) {
        return result;
      }

      // 兜底处理 - 这是网关自己的错误
      this.logger.error(`查询租户返回格式异常 - IP: ${ip}, result:`, result);
      const msg = this.i18n.t('gateway.tenant_query_failed');
      throw new InternalServerErrorException(msg);
    } catch (error) {
      // 如果是网关自己抛出的异常，继续抛出
      if (error instanceof HttpException) {
        throw error;
      }

      // 网关层面的系统异常
      this.logger.error(`查询租户异常 - IP: ${ip}:`, error);
      throw new InternalServerErrorException(
        this.i18n.t('gateway.tenant_query_failed'),
      );
    }
  }

  /**
   * 查询所有租户列表
   * @param req 请求对象，包含用户信息
   * @param ip 客户端IP地址
   * @returns 租户列表
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllTenants(@Request() req: any, @Ip() ip: string) {
    try {
      const result = await this.callAuthService(
        'tenant.findAll',
        {
          user: req.user, // 注入用户对象
        },
        {
          timeout: 5000,
          retries: 2,
          operation: '查询租户列表',
        },
      );

      // 检查微服务返回的结果格式，直接返回auth-service的响应
      if (result && typeof result === 'object' && 'code' in result) {
        return result;
      }

      // 兜底处理 - 这是网关自己的错误
      this.logger.error(
        `查询租户列表返回格式异常 - IP: ${ip}, result:`,
        result,
      );
      const msg = this.i18n.t('gateway.tenant_list_failed');
      throw new InternalServerErrorException(msg);
    } catch (error) {
      // 如果是网关自己抛出的异常，继续抛出
      if (error instanceof HttpException) {
        throw error;
      }

      // 网关层面的系统异常
      this.logger.error(`查询租户列表异常 - IP: ${ip}:`, error);
      throw new InternalServerErrorException(
        this.i18n.t('gateway.tenant_list_failed'),
      );
    }
  }

  /**
   * 修改租户状态
   * @param changeTenantStatusDto 修改租户状态数据，包含租户ID和状态
   * @param req 请求对象，包含用户信息
   * @param ip 客户端IP地址
   * @returns 修改结果
   */
  @Put('status')
  @HttpCode(HttpStatus.OK)
  async changeTenantStatus(
    @Body(new ValidationPipe()) changeTenantStatusDto: ChangeTenantStatusDto,
    @Request() req: any,
    @Ip() ip: string,
  ) {
    try {
      const result = await this.callAuthService(
        'tenant.changeStatus',
        {
          ...changeTenantStatusDto,
          user: req.user, // 注入用户对象
        },
        {
          timeout: 5000,
          retries: 2,
          operation: '修改租户状态',
        },
      );

      // 检查微服务返回的结果格式，直接返回auth-service的响应
      if (result && typeof result === 'object' && 'code' in result) {
        return result;
      }

      // 兜底处理 - 这是网关自己的错误
      this.logger.error(
        `修改租户状态返回格式异常 - IP: ${ip}, result:`,
        result,
      );
      const msg = this.i18n.t('gateway.tenant_status_change_failed');
      throw new InternalServerErrorException(msg);
    } catch (error) {
      // 如果是网关自己抛出的异常，继续抛出
      if (error instanceof HttpException) {
        throw error;
      }

      // 网关层面的系统异常
      this.logger.error(`修改租户状态异常 - IP: ${ip}:`, error);
      throw new InternalServerErrorException(
        this.i18n.t('gateway.tenant_status_change_failed'),
      );
    }
  }

  /**
   * 调用认证服务的通用方法
   * @private
   * @param pattern 微服务消息模式
   * @param data 发送的数据
   * @param options 调用选项，包括超时时间、重试次数和操作描述
   * @returns 服务调用结果
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
