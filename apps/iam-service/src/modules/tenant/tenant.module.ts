import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { RoleModule } from '../role/role.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [RoleModule, UserModule],
  controllers: [TenantController],
})
export class TenantModule {}
