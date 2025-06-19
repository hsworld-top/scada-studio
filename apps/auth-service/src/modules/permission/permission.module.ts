import { Module } from '@nestjs/common';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { CasbinModule } from '../casbin/casbin.module';

@Module({
  imports: [CasbinModule],
  controllers: [PermissionController],
  providers: [PermissionService],
})
export class PermissionModule {}
