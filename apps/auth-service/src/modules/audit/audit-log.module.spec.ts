import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogModule } from './audit-log.module';
import { AuditLogService } from './audit-log.service';

describe('AuditLogModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AuditLogModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
    expect(module.get(AuditLogService)).toBeDefined();
  });
});
