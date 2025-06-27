import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tenant } from '../tenant/entities/tenant.entity';
import { RedisLibService } from '@app/redis-lib';
import { AppLogger } from '@app/logger-lib';
import { User, UserStatus } from '../user/entities/user.entity';
import {
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AuditLogService } from '../audit/audit-log.service';

// 模拟 User 实体数据
const mockUser: Partial<User> = {
  id: 1,
  username: 'testuser',
  password: 'hashedpassword', // 模拟已哈希的密码
  email: 'test@example.com',
  tenantId: 1,
  status: UserStatus.ACTIVE,
  tenant: { id: 1, name: 'Default Tenant', slug: 'default' } as Tenant,
  roles: [{ id: 1, name: 'developer', tenantId: 1 }] as any,
};

// 模拟 Tenant 实体数据
const mockTenant: Tenant = {
  id: 1,
  name: 'Default Tenant',
  slug: 'default',
  status: 'active' as any,
  users: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let configService: ConfigService;

  // 使用 jest.fn() 创建模拟函数
  const mockUserService = {
    findOneByUsername: jest.fn(),
    findOneById: jest.fn(),
    findOrCreateBySSO: jest.fn(),
  };
  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock_jwt_token'),
    verify: jest.fn(),
    decode: jest.fn(),
  };
  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        SSO_SHARED_SECRET: 'test_sso_secret',
        SSO_ISSUER: 'https://test-idp.com',
      };
      return config[key] || defaultValue;
    }),
  };
  const mockTenantRepository = {
    findOneBy: jest.fn().mockResolvedValue(mockTenant),
  };
  const mockRedisLibService = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    client: {
      incr: jest.fn(),
      expire: jest.fn(),
    },
  };
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    setContext: jest.fn(),
  };
  const mockI18nService = {
    t: jest.fn().mockResolvedValue('mocked'),
  };
  const mockAuditLogService = {
    audit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        // 提供模拟的服务和仓库
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getRepositoryToken(Tenant), useValue: mockTenantRepository },
        { provide: RedisLibService, useValue: mockRedisLibService },
        { provide: AppLogger, useValue: mockLogger },
        { provide: I18nService, useValue: mockI18nService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  // 在每个测试后清除所有模拟
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user object if credentials are valid', async () => {
      // 模拟 bcrypt.compare 总是返回 true
      const bcrypt = require('bcrypt');
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      mockUserService.findOneByUsername.mockResolvedValue(mockUser);

      const result = await service.validateUser(
        'default',
        'testuser',
        'password',
      );
      expect(result).toEqual(expect.objectContaining({ username: 'testuser' }));
      expect(mockUserService.findOneByUsername).toHaveBeenCalledWith(
        'testuser',
        1,
      );
    });

    it('should return null if password is invalid', async () => {
      const bcrypt = require('bcrypt');
      bcrypt.compare = jest.fn().mockResolvedValue(false);
      mockUserService.findOneByUsername.mockResolvedValue(mockUser);

      const result = await service.validateUser(
        'default',
        'testuser',
        'wrongpassword',
      );
      expect(result).toBeNull();
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const inactiveUser = { ...mockUser, status: UserStatus.INACTIVE };
      mockUserService.findOneByUsername.mockResolvedValue(inactiveUser);

      await expect(
        service.validateUser('default', 'testuser', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return an access token', () => {
      const token = service.login(mockUser);
      expect(token).toHaveProperty('access_token', 'mock_jwt_token');
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id.toString(),
          tenantId: mockUser.tenantId,
        }),
      );
    });
  });

  describe('ssoLogin', () => {
    it('should successfully login via SSO and return a token', async () => {
      const ssoPayload = {
        sub: 'sso_user_id',
        email: 'sso@example.com',
        name: 'sso_user',
        tenantSlug: 'default',
      };
      mockJwtService.verify.mockResolvedValue(ssoPayload);
      mockUserService.findOrCreateBySSO.mockResolvedValue(mockUser);

      const result = await service.ssoLogin({ token: 'sso_jwt_token' });

      expect(mockJwtService.verify).toHaveBeenCalledWith('sso_jwt_token', {
        secret: 'test_sso_secret',
        issuer: 'https://test-idp.com',
      });
      expect(mockUserService.findOrCreateBySSO).toHaveBeenCalledWith({
        provider: 'https://test-idp.com',
        providerId: ssoPayload.sub,
        email: ssoPayload.email,
        username: ssoPayload.name,
        tenantSlug: ssoPayload.tenantSlug,
      });
      expect(result).toEqual({
        success: true,
        data: { access_token: 'mock_jwt_token' },
      });
    });

    it('should throw UnauthorizedException if SSO token is invalid', async () => {
      mockJwtService.verify.mockRejectedValue(new Error('Invalid token'));
      await expect(
        service.ssoLogin({ token: 'invalid_sso_token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // 可继续补充 preLoginValidate、recordLoginAttempt、logout、refreshToken 等核心方法的测试
});
