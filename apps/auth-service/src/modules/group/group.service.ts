import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository, IsNull } from 'typeorm';
import { Group } from '../user/entities/group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { FindGroupsDto } from './dto/find-groups.dto';
import { AppLogger } from '@app/logger-lib';

@Injectable()
export class GroupService {
  private readonly context = GroupService.name;
  private readonly groupTreeRepository: TreeRepository<Group>;

  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(this.context);
    this.groupTreeRepository =
      this.groupRepository.manager.getTreeRepository(Group);
  }

  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    const { name, description, parentId, tenantId } = createGroupDto;

    const query: any = {
      name,
      tenantId,
      parent: parentId ? { id: parentId } : null,
    };

    const existingGroup = await this.groupRepository.findOneBy(query);
    if (existingGroup) {
      throw new ConflictException(
        `Group with name '${name}' already exists under the same parent in this tenant.`,
      );
    }

    let parentGroup: Group | null = null;
    if (parentId) {
      parentGroup = await this.findOne(parentId, tenantId);
    }

    const group = this.groupRepository.create({
      name,
      description,
      tenantId,
      parent: parentGroup,
    });

    this.logger.log(`Creating group '${name}' in tenant ${tenantId}`);
    return this.groupRepository.save(group);
  }

  async findAll(
    findGroupsDto: FindGroupsDto,
  ): Promise<{ data: Group[]; total: number }> {
    const { page = 1, pageSize = 10, searchKeyword, tenantId } = findGroupsDto;

    const queryBuilder = this.groupRepository
      .createQueryBuilder('group')
      .where('group.tenantId = :tenantId', { tenantId });

    if (searchKeyword) {
      queryBuilder.andWhere(
        '(group.name LIKE :keyword OR group.description LIKE :keyword)',
        {
          keyword: `%${searchKeyword}%`,
        },
      );
    }

    const [data, total] = await queryBuilder
      .orderBy('group.id', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total };
  }

  async findTree(tenantId: number): Promise<Group[]> {
    const rootGroups = await this.groupTreeRepository.find({
      where: { parent: IsNull(), tenantId },
    });

    const tenantTrees = await Promise.all(
      rootGroups.map((root) =>
        this.groupTreeRepository.findDescendantsTree(root),
      ),
    );

    return tenantTrees;
  }

  async findOne(id: number, tenantId: number): Promise<Group> {
    const group = await this.groupRepository.findOneBy({ id, tenantId });
    if (!group) {
      throw new NotFoundException(
        `Group with ID ${id} not found in this tenant.`,
      );
    }
    return group;
  }

  async update(updateGroupDto: UpdateGroupDto): Promise<Group> {
    const { id, name, description, parentId, tenantId } = updateGroupDto;

    const group = await this.findOne(id, tenantId);

    if (name) group.name = name;
    if (description !== undefined) group.description = description;

    if (parentId !== undefined) {
      if (parentId === null) {
        group.parent = null;
      } else {
        if (parentId === id) {
          throw new ConflictException('A group cannot be its own parent.');
        }
        const newParent = await this.findOne(parentId, tenantId);
        group.parent = newParent;
      }
    }

    return this.groupRepository.save(group);
  }

  async remove(id: number, tenantId: number): Promise<{ success: boolean }> {
    const group = await this.findOne(id, tenantId);

    const childrenCount =
      await this.groupTreeRepository.countDescendants(group);
    if (childrenCount > 0) {
      this.logger.warn(
        `Deleting group '${group.name}' will also delete ${childrenCount} child group(s) due to CASCADE setting.`,
      );
    }

    await this.groupRepository.remove(group);
    this.logger.log(
      `Deleted group '${group.name}' (ID: ${id}) from tenant ${tenantId}.`,
    );

    return { success: true };
  }
}
