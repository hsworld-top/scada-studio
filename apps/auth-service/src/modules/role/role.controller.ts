import { Controller, UseGuards, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PermissionsGuard } from '../../common/guards/permissions/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions/require-permissions.decorator';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { FindRolesDto } from './dto/find-roles.dto';

@Controller('roles')
@UseGuards(PermissionsGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @MessagePattern('roles.create')
  @RequirePermissions({ resource: 'role', action: 'create' })
  async create(@Payload(new ValidationPipe()) createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @MessagePattern('roles.findAll')
  @RequirePermissions({ resource: 'role', action: 'read' })
  async findAll(
    @Payload(new ValidationPipe({ transform: true }))
    findRolesDto: FindRolesDto,
  ) {
    return this.roleService.findAll(findRolesDto);
  }

  @MessagePattern('roles.findOne')
  @RequirePermissions({ resource: 'role', action: 'read' })
  async findOne(@Payload() payload: { id: number; tenantId: number }) {
    return this.roleService.findOne(payload.id, payload.tenantId);
  }

  @MessagePattern('roles.update')
  @RequirePermissions({ resource: 'role', action: 'update' })
  async update(@Payload(new ValidationPipe()) updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(updateRoleDto);
  }

  @MessagePattern('roles.delete')
  @RequirePermissions({ resource: 'role', action: 'delete' })
  async remove(@Payload() payload: { id: number; tenantId: number }) {
    return this.roleService.remove(payload.id, payload.tenantId);
  }
}
