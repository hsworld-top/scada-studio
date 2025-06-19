import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from '../user/entities/group.entity';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { CasbinModule } from '../casbin/casbin.module';

@Module({
  imports: [TypeOrmModule.forFeature([Group]), CasbinModule],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [TypeOrmModule, GroupService],
})
export class GroupModule {}
