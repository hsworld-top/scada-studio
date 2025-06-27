import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../user/entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { FindRolesDto } from './dto/find-roles.dto';
import { CasbinService } from '../casbin/casbin.service';
import { AppLogger } from '@app/logger-lib';
import { I18nService } from 'nestjs-i18n';
import { AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class RoleService {
  private readonly context = RoleService.name;

  constructor(
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    private readonly casbinService: CasbinService,
    private readonly logger: AppLogger,
    private readonly i18n: I18nService,
    private readonly auditLogService: AuditLogService,
  ) {
    this.logger.setContext(this.context);
  }

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const { name, description, tenantId } = createRoleDto;

    const existingRole = await this.roleRepository.findOneBy({
      name,
      tenantId,
    });
    if (existingRole) {
      throw new ConflictException(await this.i18n.t('common.role_exists', { args: { name } }));
    }

    const role = this.roleRepository.create({ name, description, tenantId });
    this.logger.log(`Creating role '${name}' in tenant ${tenantId}`);
    const savedRole = await this.roleRepository.save(role);
    await this.auditLogService.audit({
      userId: createRoleDto.operatorId,
      tenantId,
      action: 'create',
      resource: 'role',
      targetId: savedRole.id.toString(),
      detail: { ...createRoleDto },
      result: 'success',
    });
    return savedRole;
  }

  async findAll(
    findRolesDto: FindRolesDto,
  ): Promise<{ data: Role[]; total: number }> {
    const { page = 1, pageSize = 10, searchKeyword, tenantId } = findRolesDto;

    const queryBuilder = this.roleRepository
      .createQueryBuilder('role')
      .where('role.tenantId = :tenantId', { tenantId });

    if (searchKeyword) {
      queryBuilder.andWhere(
        '(role.name LIKE :keyword OR role.description LIKE :keyword)',
        {
          keyword: `%${searchKeyword}%`,
        },
      );
    }

    const [data, total] = await queryBuilder
      .orderBy('role.id', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: number, tenantId: number): Promise<Role> {
    const role = await this.roleRepository.findOneBy({ id, tenantId });
    if (!role) {
      throw new NotFoundException(await this.i18n.t('common.role_not_found'));
    }
    return role;
  }

  async update(updateRoleDto: UpdateRoleDto): Promise<Role> {
    const { id, name, description, tenantId } = updateRoleDto;

    const role = await this.findOne(id, tenantId);

    if (name && name !== role.name) {
      const existingRole = await this.roleRepository.findOneBy({
        name,
        tenantId,
      });
      if (existingRole) {
        throw new ConflictException(await this.i18n.t('common.role_exists', { args: { name } }));
      }
      this.logger.warn(
        `Role name is being changed from '${role.name}' to '${name}'. This can have significant permission implications and may require manual policy updates if not handled carefully.`,
      );
      role.name = name;
    }

    if (description !== undefined) {
      role.description = description;
    }

    const updatedRole = await this.roleRepository.save(role);
    await this.auditLogService.audit({
      userId: updateRoleDto.operatorId,
      tenantId,
      action: 'update',
      resource: 'role',
      targetId: id.toString(),
      detail: { ...updateRoleDto },
      result: 'success',
    });
    return updatedRole;
  }

  async remove(id: number, tenantId: number, operatorId?: number): Promise<{ success: boolean }> {
    const role = await this.findOne(id, tenantId);

    // It is a good practice to check if the role is still in use before deleting.
    // For now, we assume this check is handled by the client or not strictly required.

    await this.roleRepository.remove(role);
    await this.casbinService
      .getEnforcer()
      .removeFilteredPolicy(0, role.name, tenantId.toString());
    await this.casbinService
      .getEnforcer()
      .removeFilteredGroupingPolicy(1, role.name, tenantId.toString());
    this.logger.log(
      `Deleted role '${role.name}' (ID: ${id}) and its associated policies from tenant ${tenantId}.`,
    );

    await this.auditLogService.audit({
      userId: operatorId,
      tenantId,
      action: 'delete',
      resource: 'role',
      targetId: id.toString(),
      result: 'success',
    });
    return { success: true };
  }
}
