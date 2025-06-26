import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { User } from '../user/entities/user.entity';
import { Role } from '../user/entities/role.entity';
import { TenantInitializerService } from './tenant-initializer.service';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { CasbinModule } from '../casbin/casbin.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, User, Role]), CasbinModule],
  providers: [TenantService, TenantInitializerService],
  controllers: [TenantController],
  exports: [TypeOrmModule, TenantService, TenantInitializerService],
})
export class TenantModule {}
