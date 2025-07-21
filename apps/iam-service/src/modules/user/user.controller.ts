import { Controller, UseGuards, ValidationPipe } from '@nestjs/common'; // 导入 Controller、UseGuards 和 ValidationPipe 装饰器
import { MessagePattern, Payload } from '@nestjs/microservices'; // 导入 MessagePattern 和 Payload 装饰器
import { UserService } from './user.service'; // 导入 UserService
import {
  CreateUserDto,
  UpdateUserDto,
  FindUsersDto,
} from '@app/shared-dto-lib'; // 导入 CreateUserDto、UpdateUserDto 和 FindUsersDto
import { PermissionGuard } from '../../common/guards/permission.guard'; // 导入 PermissionGuard
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator'; // 导入 RequirePermissions 装饰器
import { IAM_MESSAGE_PATTERNS } from '../../common/constants/iam.constants'; // 导入 IAM_MESSAGE_PATTERNS 常量

@Controller('users')
@UseGuards(PermissionGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern(IAM_MESSAGE_PATTERNS.USER.CREATE)
  @RequirePermissions({ resource: 'user', action: 'create' })
  async create(@Payload(new ValidationPipe()) createUserDto: CreateUserDto) {
    try {
      const result = await this.userService.create(createUserDto);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @MessagePattern(IAM_MESSAGE_PATTERNS.USER.FIND_ALL)
  @RequirePermissions({ resource: 'user', action: 'read' })
  async findAll(@Payload(new ValidationPipe()) findUsersDto: FindUsersDto) {
    try {
      const result = await this.userService.findAll(findUsersDto.tenantId);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @MessagePattern(IAM_MESSAGE_PATTERNS.USER.FIND_ONE)
  @RequirePermissions({ resource: 'user', action: 'read' })
  async findOne(@Payload() payload: { id: number; tenantId: number }) {
    try {
      const result = await this.userService.findOne(
        payload.id,
        payload.tenantId,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @MessagePattern(IAM_MESSAGE_PATTERNS.USER.UPDATE)
  @RequirePermissions({ resource: 'user', action: 'update' })
  async update(@Payload(new ValidationPipe()) updateUserDto: UpdateUserDto) {
    try {
      const result = await this.userService.update(
        updateUserDto.id,
        updateUserDto,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @MessagePattern(IAM_MESSAGE_PATTERNS.USER.REMOVE)
  @RequirePermissions({ resource: 'user', action: 'delete' })
  async remove(@Payload() payload: { id: number; tenantId: number }) {
    try {
      const result = await this.userService.remove(
        payload.id,
        payload.tenantId,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
