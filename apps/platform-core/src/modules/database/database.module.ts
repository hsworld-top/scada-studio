import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformUser } from '../platform-user/platform-user.entity';
import { Tenant } from '../platform-tenant/platform-tenant.entity';

/**
 * 共享数据库模块
 * @description
 * 这个模块的唯一职责是使用 TypeOrmModule.forFeature() 来注册所有业务实体。
 * 通过将所有实体注册和导出集中在此，我们避免了业务模块之间为了获取对方的 Repository 而产生的循环依赖。
 * @decorator @Global() 使这个模块注册的 providers (即所有实体的 Repository) 在全局可用，
 * 简化了业务模块的 imports 数组，无需在每个模块中都显式导入 SharedDatabaseModule。
 */
@Global() // 将此模块设置为全局模块
@Module({
  imports: [
    // 在这里一次性注册所有需要在应用中共享的实体
    TypeOrmModule.forFeature([PlatformUser, Tenant]),
  ],
  exports: [
    // 导出 TypeOrmModule，以便注入 Repository 的模块可以访问它
    TypeOrmModule,
  ],
})
export class SharedDatabaseModule {}
