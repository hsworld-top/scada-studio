import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { CasbinModule } from '../casbin/casbin.module';
import { TenantModule } from '../tenant/tenant.module';
import { GroupModule } from '../group/group.module';
import { RoleModule } from '../role/role.module';
import { AuditLogModule } from '../audit/audit-log.module';
/**
 * UserModule 负责用户相关的依赖注入与模块组织。
 */
@Module({
  imports: [
    TenantModule,
    GroupModule,
    CasbinModule,
    RoleModule,
    AuditLogModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
