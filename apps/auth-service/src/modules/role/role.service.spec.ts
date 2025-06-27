import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from './role.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from '../user/entities/role.entity';
import { AppLogger } from '@app/logger-lib';
import { I18nService } from 'nestjs-i18n';
import { AuditLogService } from '../audit/audit-log.service';

describe('RoleService', () => {
  let service: RoleService;
  let roleRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: getRepositoryToken(Role),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
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

    service = module.get<RoleService>(RoleService);
    roleRepo = module.get(getRepositoryToken(Role));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // 可继续补充 create、findAll、update、remove 等核心方法的测试
});
