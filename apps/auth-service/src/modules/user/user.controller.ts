import { Controller, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PermissionsGuard } from '../../common/guards/permissions/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions/require-permissions.decorator';

/**
 * UserController 负责处理用户相关的微服务请求。
 */
@Controller('users')
export class UserController {
  /**
   * 构造函数，注入用户服务。
   * @param userService 用户服务
   */
  constructor(private readonly userService: UserService) {}

  /**
   * 处理创建用户的微服务消息。
   * 需通过权限守卫和权限装饰器校验。
   * @param createUserDto 创建用户的数据传输对象
   * @returns 创建成功的用户信息（不包含密码）
   */
  @MessagePattern('users.create')
  @UseGuards(PermissionsGuard)
  @RequirePermissions({ resource: 'user', action: 'create' })
  async create(@Payload() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }
}
