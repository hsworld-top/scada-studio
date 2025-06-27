import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Tenant } from '../tenant/entities/tenant.entity';
import { Group } from './entities/group.entity';
import { CasbinService } from '../casbin/casbin.service';
import { AppLogger } from '@app/logger-lib';
import { I18nService } from 'nestjs-i18n';
import { AuditLogService } from '../audit/audit-log.service';

describe('UserService', () => {
  let service: UserService;
  let userRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: { findOne: jest.fn(), save: jest.fn(), update: jest.fn() },
        },
        { provide: getRepositoryToken(Role), useValue: {} },
        { provide: getRepositoryToken(Group), useValue: {} },
        { provide: getRepositoryToken(Tenant), useValue: {} },
        { provide: CasbinService, useValue: { getEnforcer: jest.fn() } },
        {
          provide: AppLogger,
          useValue: { log: jest.fn(), setContext: jest.fn() },
        },
        {
          provide: I18nService,
          useValue: { t: jest.fn().mockResolvedValue('mocked') },
        },
        { provide: AuditLogService, useValue: { audit: jest.fn() } },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepo = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw if user not found', async () => {
    userRepo.findOne.mockResolvedValue(null);
    await expect(service.findOneById(1, 1)).rejects.toThrow();
  });

  // 可继续补充 create、update、setStatus、getProfile 等核心方法的测试
});
