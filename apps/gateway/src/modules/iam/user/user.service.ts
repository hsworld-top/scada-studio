import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateUserDto,
  UpdateUserDto,
  FindAllUserDto,
  FindOneUserDto,
  RemoveUsersDto,
} from '@app/shared-dto-lib';

/**
 * 用户管理服务
 * @description 转发用户相关请求到IAM服务
 */
@Injectable()
export class UserService {
  constructor(
    @Inject('IAM_SERVICE') private readonly iamServiceClient: ClientProxy,
  ) {}

  /**
   * 创建用户
   * @description 调用IAM服务创建新用户
   * @param createUserDto 创建用户信息
   * @returns 创建的用户信息
   */
  create(createUserDto: CreateUserDto) {
    return this.iamServiceClient.send('iam.user.create', createUserDto);
  }

  /**
   * 查找所有用户
   * @description 调用IAM服务获取指定租户下的所有用户
   * @param findAllUserDto 查询条件
   * @returns 用户列表
   */
  findAll(findAllUserDto: FindAllUserDto) {
    return this.iamServiceClient.send('iam.user.findAll', findAllUserDto);
  }

  /**
   * 查找单个用户
   * @description 调用IAM服务获取指定用户的详细信息
   * @param findOneUserDto 查询条件
   * @returns 用户详细信息
   */
  findOne(findOneUserDto: FindOneUserDto) {
    return this.iamServiceClient.send('iam.user.findOne', findOneUserDto);
  }

  /**
   * 更新用户
   * @description 调用IAM服务更新用户信息
   * @param updateUserDto 更新用户信息
   * @returns 更新后的用户信息
   */
  update(updateUserDto: UpdateUserDto) {
    return this.iamServiceClient.send('iam.user.update', updateUserDto);
  }

  /**
   * 批量删除用户
   * @description 调用IAM服务批量删除用户
   * @param removeUsersDto 删除用户信息
   * @returns 删除结果
   */
  remove(removeUsersDto: RemoveUsersDto) {
    return this.iamServiceClient.send('iam.user.remove', removeUsersDto);
  }
}
