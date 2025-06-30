import { Controller, UseGuards, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateUserDto,
  FindUsersDto,
  UpdateUserDto,
  SetUserStatusDto,
  UpdateProfileDto,
  ChangePasswordDto,
  SecurityPolicyDto,
  UsernameBlacklistDto,
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

  @MessagePattern('users.setMultiSession')
  async setMultiSession(
    @Payload(new ValidationPipe())
    payload: { userId: number; allowMultiSession: boolean },
    @CurrentUserId() operatorId: number,
  ) {
    return this.userService.setMultiSession(
      payload.userId,
      payload.allowMultiSession,
      operatorId,
    );
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions({ resource: 'user', action: 'manage_security_policy' })
  @MessagePattern('settings.getSecurityPolicy')
  async getSecurityPolicy(@Payload() payload: { tenantId: number }) {
    return this.userService.getSecurityPolicy(payload.tenantId);
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions({ resource: 'user', action: 'manage_security_policy' })
  @MessagePattern('settings.updateSecurityPolicy')
  async updateSecurityPolicy(
    @Payload() payload: { tenantId: number; dto: SecurityPolicyDto },
  ) {
    return this.userService.updateSecurityPolicy(payload.tenantId, payload.dto);
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions({ resource: 'user', action: 'manage_username_blacklist' })
  @MessagePattern('settings.listUsernameBlacklist')
  async listUsernameBlacklist(@Payload() payload: { tenantId: number }) {
    return this.userService.listUsernameBlacklist(payload.tenantId);
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions({ resource: 'user', action: 'manage_username_blacklist' })
  @MessagePattern('settings.addUsernameBlacklist')
  async addUsernameBlacklist(
    @Payload() payload: { tenantId: number; dto: UsernameBlacklistDto },
  ) {
    return this.userService.addUsernameBlacklist(payload.tenantId, payload.dto);
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions({ resource: 'user', action: 'manage_username_blacklist' })
  @MessagePattern('settings.removeUsernameBlacklist')
  async removeUsernameBlacklist(
    @Payload() payload: { tenantId: number; dto: UsernameBlacklistDto },
  ) {
    return this.userService.removeUsernameBlacklist(
      payload.tenantId,
      payload.dto,
    );
  }
}
