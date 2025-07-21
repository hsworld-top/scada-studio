import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { Group } from '../group/entities/group.entity';
import { SecuritySettings } from '../security/entities/security-settings.entity';

/**
 * 共享数据库模块
 * @description
 * 这个模块的唯一职责是使用 TypeOrmModule.forFeature() 来注册所有业务实体。
 * 通过将所有实体注册和导出集中在此，我们避免了业务模块之间为了获取对方的 Repository 而产生的循环依赖。
 * @decorator @Global() 使这个模块注册的 providers (即所有实体的 Repository) 在全局可用，
 * 简化了业务模块的 imports 数组，无需在每个模块中都显式导入 SharedDatabaseModule。
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Group, SecuritySettings]),
  ],
  exports: [
    TypeOrmModule,
  ],
})
export class SharedDatabaseModule {}