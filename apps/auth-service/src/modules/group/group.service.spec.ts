import { Test, TestingModule } from '@nestjs/testing';
import { GroupService } from './group.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Group } from '../user/entities/group.entity';
import { AppLogger } from '@app/logger-lib';
import { I18nService } from 'nestjs-i18n';
import { AuditLogService } from '../audit/audit-log.service';

describe('GroupService', () => {
  let service: GroupService;
  let groupRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupService,
        {
          provide: getRepositoryToken(Group),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            find: jest.fn(),
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

    service = module.get<GroupService>(GroupService);
    groupRepo = module.get(getRepositoryToken(Group));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // 可继续补充 create、findAll、findTree、update、remove 等核心方法的测试
});
