import { Module } from '@nestjs/common';
import { PermissionController } from './permission.controller';
import { CasbinModule } from '../casbin/casbin.module';

@Module({
  imports: [CasbinModule],
  controllers: [PermissionController],
})
export class PermissionModule {}
