import { Controller, ValidationPipe } from '@nestjs/common'; // 导入 Controller 和 ValidationPipe 装饰器
import { MessagePattern, Payload } from '@nestjs/microservices'; // 导入 MessagePattern 和 Payload 装饰器
import { UserService } from './user.service'; // 导入 UserService
import {
  CreateUserDto,
  UpdateUserDto,
  FindAllUserDto,
  FindOneUserDto,
  RemoveUsersDto,
} from '@app/shared-dto-lib';
import { ResponseCode } from '@app/shared-dto-lib';
/**
 * 用户控制器
 */
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  /**
   * 创建用户
   * @param createUserDto 创建用户DTO
   * @returns 创建用户结果
   */
  @MessagePattern('iam.user.create')
  async create(@Payload(new ValidationPipe()) createUserDto: CreateUserDto) {
    const result = await this.userService.create(createUserDto);
    return {
      code: ResponseCode.SUCCESS,
      msg: 'iam.user.create_success',
      data: result,
    };
  }

  /**
   * 查找所有用户
   * @param payload 查找所有用户DTO
   * @returns 查找所有用户结果
   */
  @MessagePattern('iam.user.findAll')
  async findAll(@Payload(new ValidationPipe()) payload: FindAllUserDto) {
    const result = await this.userService.findAll(payload.tenantId);
    return {
      code: ResponseCode.SUCCESS,
      msg: 'iam.user.findAll_success',
      data: result,
    };
  }

  /**
   * 查找单个用户
   * @param payload 查找单个用户DTO
   * @returns 查找单个用户结果
   */
  @MessagePattern('iam.user.findOne')
  async findOne(@Payload(new ValidationPipe()) payload: FindOneUserDto) {
    const result = await this.userService.findOne(payload.id, payload.tenantId);
    return {
      code: ResponseCode.SUCCESS,
      msg: 'iam.user.findOne_success',
      data: result,
    };
  }

  /**
   * 更新用户
   * @param updateUserDto 更新用户DTO
   * @returns 更新用户结果
   */
  @MessagePattern('iam.user.update')
  async update(@Payload(new ValidationPipe()) payload: UpdateUserDto) {
    const result = await this.userService.update(payload);
    return {
      code: ResponseCode.SUCCESS,
      msg: 'iam.user.update_success',
      data: result,
    };
  }

  /**
   * 批量删除用户
   * @param payload 删除用户DTO
   * @returns 删除用户结果
   */
  @MessagePattern('iam.user.remove')
  async remove(@Payload(new ValidationPipe()) payload: RemoveUsersDto) {
    const result = await this.userService.remove(payload.ids, payload.tenantId);
    return {
      code: ResponseCode.SUCCESS,
      msg: 'iam.user.remove_success',
      data: result,
    };
  }
}
