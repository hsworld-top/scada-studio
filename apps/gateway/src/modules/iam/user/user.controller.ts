import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  FindAllUserDto,
  FindOneUserDto,
  RemoveUsersDto,
} from '@app/shared-dto-lib';

/**
 * 用户管理控制器
 * @description 处理用户相关的HTTP请求，转发到IAM服务
 */
@Controller('api/iam')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 创建用户
   * @description 在指定租户下创建新用户
   * @param createUserDto 创建用户信息
   * @returns 创建的用户信息
   */
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  /**
   * 查找所有用户
   * @description 获取指定租户下的所有用户列表
   * @param findAllUserDto 查询条件
   * @returns 用户列表
   */
  @Post('find-all')
  findAll(@Body() findAllUserDto: FindAllUserDto) {
    return this.userService.findAll(findAllUserDto);
  }

  /**
   * 查找单个用户
   * @description 根据用户ID获取用户详细信息
   * @param findOneUserDto 查询条件
   * @returns 用户详细信息
   */
  @Post('find-one')
  findOne(@Body() findOneUserDto: FindOneUserDto) {
    return this.userService.findOne(findOneUserDto);
  }

  /**
   * 更新用户
   * @description 更新指定用户的信息
   * @param updateUserDto 更新用户信息
   * @returns 更新后的用户信息
   */
  @Put()
  update(@Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(updateUserDto);
  }

  /**
   * 批量删除用户
   * @description 批量删除指定用户
   * @param removeUsersDto 删除用户信息
   * @returns 删除结果
   */
  @Delete()
  remove(@Body() removeUsersDto: RemoveUsersDto) {
    return this.userService.remove(removeUsersDto);
  }
}
