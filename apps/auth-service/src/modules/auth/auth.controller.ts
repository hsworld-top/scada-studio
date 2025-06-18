import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginDto } from '../user/dto/login.dto';
import { AuthGuard } from '@nestjs/passport';

/**
 * AuthController 负责处理认证相关的 HTTP 和微服务请求。
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 处理微服务的登录消息，校验用户并返回 token。
   * @param loginDto 登录数据传输对象
   * @returns 登录结果，包含 token 或错误信息
   */
  @MessagePattern('auth.login')
  async login(@Payload() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
    );
    if (!user) {
      return { success: false, message: '用户名或密码错误' };
    }
    const token = this.authService.login(user);
    return { success: true, data: token };
  }

  /**
   * 处理 HTTP 的登出请求，将 token 加入黑名单。
   * @param req 请求对象，包含认证 token
   * @returns 登出结果
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async httpLogout(@Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await this.authService.logout(token);
    }
    return { success: true, message: '登出成功' };
  }
}
