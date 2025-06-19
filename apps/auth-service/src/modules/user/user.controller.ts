import { Controller, UseGuards, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PermissionsGuard } from '../../common/guards/permissions/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions/require-permissions.decorator';
import { FindUsersDto } from './dto/find-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SetUserStatusDto } from './dto/set-user-status.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

/**
 * UserController 负责处理用户相关的微服务请求。
 */
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // --- Admin-only Endpoints ---
  @UseGuards(PermissionsGuard)
  @MessagePattern('users.create')
  @RequirePermissions({ resource: 'user', action: 'create' })
  async create(@Payload(new ValidationPipe()) createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @UseGuards(PermissionsGuard)
  @MessagePattern('users.findAll')
  @RequirePermissions({ resource: 'user', action: 'read' })
  async findAll(
    @Payload(new ValidationPipe({ transform: true }))
    findUsersDto: FindUsersDto,
  ) {
    return this.userService.findAll(findUsersDto);
  }

  @UseGuards(PermissionsGuard)
  @MessagePattern('users.update')
  @RequirePermissions({ resource: 'user', action: 'update' })
  async update(@Payload(new ValidationPipe()) updateUserDto: UpdateUserDto) {
    return this.userService.update(updateUserDto);
  }

  @UseGuards(PermissionsGuard)
  @MessagePattern('users.setStatus')
  @RequirePermissions({ resource: 'user', action: 'manage_status' })
  async setStatus(
    @Payload(new ValidationPipe()) setUserStatusDto: SetUserStatusDto,
  ) {
    return this.userService.setStatus(setUserStatusDto);
  }

  @UseGuards(PermissionsGuard)
  @MessagePattern('users.delete')
  @RequirePermissions({ resource: 'user', action: 'delete' })
  async remove(@Payload() payload: { userId: number; tenantId: number }) {
    return this.userService.remove(payload.userId, payload.tenantId);
  }

  // --- Self-service Endpoints (for logged-in users) ---

  @MessagePattern('users.getProfile')
  async getProfile(
    @Payload() payload: { currentUserId: number; tenantId: number },
  ) {
    return this.userService.getProfile(payload.currentUserId, payload.tenantId);
  }

  @MessagePattern('users.updateProfile')
  async updateProfile(
    @Payload(new ValidationPipe()) updateProfileDto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(updateProfileDto);
  }

  @MessagePattern('users.changePassword')
  async changePassword(
    @Payload(new ValidationPipe()) changePasswordDto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(changePasswordDto);
  }
}
