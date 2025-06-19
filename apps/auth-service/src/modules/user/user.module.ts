import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Group } from './entities/group.entity';
import { CasbinModule } from '../casbin/casbin.module';
import { TenantModule } from '../tenant/tenant.module';
import { GroupModule } from '../group/group.module';
import { RoleModule } from '../role/role.module';
import { ConfigModule } from '@nestjs/config';

/**
 * UserModule 负责用户相关的依赖注入与模块组织。
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Group]), // 只注册本模块直接管理的实体
    TenantModule,
    GroupModule,
    CasbinModule,
    ConfigModule,
    forwardRef(() => RoleModule), // 引入 RoleModule 以使用 RoleRepository
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
