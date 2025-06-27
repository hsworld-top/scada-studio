import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from './audit-log.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let repo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: { save: jest.fn(), create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    repo = module.get(getRepositoryToken(AuditLog));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call save and create on audit', async () => {
    repo.create.mockReturnValue({});
    repo.save.mockResolvedValue({});
    await service.audit({
      userId: 1,
      action: 'test',
      resource: 'user',
      targetId: '1',
      result: 'success',
    });
    expect(repo.create).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
  });
});
