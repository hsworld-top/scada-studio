import { Test, TestingModule } from '@nestjs/testing';
import { TenantService } from './tenant.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantInitializerService } from './tenant-initializer.service';
import { I18nService } from 'nestjs-i18n';
import { AuditLogService } from '../audit/audit-log.service';

describe('TenantService', () => {
  let service: TenantService;
  let tenantRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: TenantInitializerService,
          useValue: { initTenantData: jest.fn() },
        },
        {
          provide: I18nService,
          useValue: { t: jest.fn().mockResolvedValue('mocked') },
        },
        { provide: AuditLogService, useValue: { audit: jest.fn() } },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    tenantRepo = module.get(getRepositoryToken(Tenant));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // 可继续补充 createTenant、updateTenant、deleteTenant、findTenantById、findAllTenants、changeStatus 等核心方法的测试
});
