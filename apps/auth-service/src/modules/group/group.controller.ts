import { Controller, UseGuards, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PermissionsGuard } from '../../common/guards/permissions/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions/require-permissions.decorator';
import { GroupService } from './group.service';
import {
  CreateGroupDto,
  UpdateGroupDto,
  FindGroupsDto,
} from '@app/shared-dto-lib';

@Controller('groups')
@UseGuards(PermissionsGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @MessagePattern('groups.create')
  @RequirePermissions({ resource: 'group', action: 'create' })
  async create(@Payload(new ValidationPipe()) createGroupDto: CreateGroupDto) {
    return this.groupService.create(createGroupDto);
  }

  @MessagePattern('groups.findAll')
  @RequirePermissions({ resource: 'group', action: 'read' })
  async findAll(
    @Payload(new ValidationPipe({ transform: true }))
    findGroupsDto: FindGroupsDto,
  ) {
    return this.groupService.findAll(findGroupsDto);
  }

  @MessagePattern('groups.findTree')
  @RequirePermissions({ resource: 'group', action: 'read' })
  async findTree(@Payload() payload: { tenantId: number }) {
    return this.groupService.findTree(payload.tenantId);
  }

  @MessagePattern('groups.findOne')
  @RequirePermissions({ resource: 'group', action: 'read' })
  async findOne(@Payload() payload: { id: number; tenantId: number }) {
    return this.groupService.findOne(payload.id, payload.tenantId);
  }

  @MessagePattern('groups.update')
  @RequirePermissions({ resource: 'group', action: 'update' })
  async update(@Payload(new ValidationPipe()) updateGroupDto: UpdateGroupDto) {
    return this.groupService.update(updateGroupDto);
  }

  @MessagePattern('groups.delete')
  @RequirePermissions({ resource: 'group', action: 'delete' })
  async remove(@Payload() payload: { id: number; tenantId: number }) {
    return this.groupService.remove(payload.id, payload.tenantId);
  }
}
