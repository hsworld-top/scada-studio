import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { IamSharedModule } from '../../share/iam-shared.module';

/**
 * 用户组管理模块
 * @description 处理用户组相关的HTTP请求，转发到IAM服务
 */
@Module({
  imports: [IamSharedModule],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
