import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { Group } from '../group/entities/group.entity';
import { CasbinModule } from '../casbin/casbin.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Group]), CasbinModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
