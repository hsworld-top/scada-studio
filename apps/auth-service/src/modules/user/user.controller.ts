import { Controller, UseGuards, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateUserDto,
  FindUsersDto,
  UpdateUserDto,
  SetUserStatusDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from '@app/shared-dto-lib';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PermissionsGuard } from '../../common/guards/permissions/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions/require-permissions.decorator';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';

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
  async create(
    @Payload(new ValidationPipe()) createUserDto: CreateUserDto,
    @CurrentUserId() operatorId: number,
  ) {
    createUserDto.operatorId = createUserDto.operatorId || operatorId;
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
  async update(
    @Payload(new ValidationPipe()) updateUserDto: UpdateUserDto,
    @CurrentUserId() operatorId: number,
  ) {
    updateUserDto.operatorId = updateUserDto.operatorId || operatorId;
    return this.userService.update(updateUserDto);
  }

  @UseGuards(PermissionsGuard)
  @MessagePattern('users.setStatus')
  @RequirePermissions({ resource: 'user', action: 'manage_status' })
  async setStatus(
    @Payload(new ValidationPipe()) setUserStatusDto: SetUserStatusDto,
    @CurrentUserId() operatorId: number,
  ) {
    setUserStatusDto.operatorId = setUserStatusDto.operatorId || operatorId;
    return this.userService.setStatus(setUserStatusDto);
  }

  @UseGuards(PermissionsGuard)
  @MessagePattern('users.delete')
  @RequirePermissions({ resource: 'user', action: 'delete' })
  async remove(
    @Payload()
    payload: {
      userId: number;
      tenantId: number;
      operatorId?: number;
      currentUserId?: number;
    },
    @CurrentUserId() operatorId: number,
  ) {
    return this.userService.remove(
      payload.userId,
      payload.tenantId,
      payload.operatorId || operatorId,
    );
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
    @CurrentUserId() operatorId: number,
  ) {
    updateProfileDto.operatorId = updateProfileDto.operatorId || operatorId;
    return this.userService.updateProfile(updateProfileDto);
  }

  @MessagePattern('users.changePassword')
  async changePassword(
    @Payload(new ValidationPipe()) changePasswordDto: ChangePasswordDto,
    @CurrentUserId() operatorId: number,
  ) {
    changePasswordDto.operatorId = changePasswordDto.operatorId || operatorId;
    return this.userService.changePassword(changePasswordDto);
  }
}
