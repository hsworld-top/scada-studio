import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { CasbinModule } from '../casbin/casbin.module';

/**
 * UserModule 负责用户相关的依赖注入与模块组织。
 *
 * - imports: 注册 User 和 Role 实体到 TypeORM。
 * - controllers: 注册用户控制器。
 * - providers: 注册用户服务。
 * - exports: 导出用户服务供其他模块使用。
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, Role]), CasbinModule], // 注册实体
  controllers: [UserController], // 用户控制器
  providers: [UserService], // 用户服务
  exports: [UserService], // 导出用户服务
})
export class UserModule {}
