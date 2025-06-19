import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Group } from './entities/group.entity';
import { Tenant } from '../tenant/entities/tenant.entity';
import { CasbinService } from '../casbin/casbin.service';
import { AppLogger } from '@app/logger-lib';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

// 模拟数据
const mockUser = {
  id: 1,
  username: 'testuser',
  password: 'hashedpassword',
  email: 'test@example.com',
  tenantId: 1,
};

describe('UserService', () => {
  let service: UserService;

  // 模拟仓库和服务的对象
  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
  };
  const mockRoleRepository = {
    find: jest.fn(),
  };
  const mockGroupRepository = {
    find: jest.fn(),
  };
  const mockTenantRepository = {
    findOneBy: jest.fn(),
  };
  const mockCasbinService = {
    addRoleForUser: jest.fn(),
  };
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    setContext: jest.fn(),
  };
  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Role), useValue: mockRoleRepository },
        { provide: getRepositoryToken(Group), useValue: mockGroupRepository },
        { provide: getRepositoryToken(Tenant), useValue: mockTenantRepository },
        { provide: CasbinService, useValue: mockCasbinService },
        { provide: AppLogger, useValue: mockLogger },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      username: 'newuser',
      password: 'password123',
      email: 'new@example.com',
      tenantId: 1,
      roleNames: ['developer'],
    };

    it('should create and return a user', async () => {
      mockTenantRepository.findOneBy.mockResolvedValue({ id: 1 });
      mockUserRepository.findOne.mockResolvedValue(null); // 假设用户不存在
      mockRoleRepository.find.mockResolvedValue([{ id: 1, name: 'developer' }]);
      mockUserRepository.create.mockReturnValue(createUserDto);
      mockUserRepository.save.mockResolvedValue({ id: 2, ...createUserDto });
      mockCasbinService.addRoleForUser.mockResolvedValue(true);

      const result = await service.create(createUserDto);

      expect(result.username).toEqual(createUserDto.username);
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockCasbinService.addRoleForUser).toHaveBeenCalledWith(
        '2',
        'developer',
        '1',
      );
    });

    it('should throw ConflictException if username already exists', async () => {
      mockTenantRepository.findOneBy.mockResolvedValue({ id: 1 });
      mockUserRepository.findOne.mockResolvedValue({ username: 'newuser' }); // 假设用户已存在

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if role does not exist', async () => {
      mockTenantRepository.findOneBy.mockResolvedValue({ id: 1 });
      mockUserRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.find.mockResolvedValue([]); // 假设角色找不到

      await expect(service.create(createUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('changePassword', () => {
    it('should change password successfully with correct old password', async () => {
      const bcrypt = require('bcrypt');
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      bcrypt.hash = jest.fn().mockResolvedValue('newhashedpassword');

      mockUserRepository.findOneBy.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        password: 'newhashedpassword',
      });

      const result = await service.changePassword({
        currentUserId: 1,
        tenantId: 1,
        oldPassword: 'hashedpassword',
        newPassword: 'newpassword123',
      });

      expect(result.success).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'newhashedpassword' }),
      );
    });

    it('should throw UnauthorizedException with incorrect old password', async () => {
      const bcrypt = require('bcrypt');
      bcrypt.compare = jest.fn().mockResolvedValue(false);
      mockUserRepository.findOneBy.mockResolvedValue(mockUser);

      await expect(
        service.changePassword({
          currentUserId: 1,
          tenantId: 1,
          oldPassword: 'wrongoldpassword',
          newPassword: 'newpassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
