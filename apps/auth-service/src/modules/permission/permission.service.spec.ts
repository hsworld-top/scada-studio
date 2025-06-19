import { Test, TestingModule } from '@nestjs/testing';
import { PermissionService } from './permission.service';
import { CasbinService } from '../casbin/casbin.service';
import { AppLogger } from '@app/logger-lib';
import { SYSTEM_PERMISSIONS } from './permission.constants';

describe('PermissionService', () => {
  let service: PermissionService;

  // 模拟 Casbin Enforcer
  const mockEnforcer = {
    getFilteredPolicy: jest.fn(),
    removeFilteredPolicy: jest.fn(),
    addPolicies: jest.fn(),
    savePolicy: jest.fn(),
  };

  const mockCasbinService = {
    getEnforcer: jest.fn().mockReturnValue(mockEnforcer),
  };
  const mockLogger = {
    log: jest.fn(),
    setContext: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        { provide: CasbinService, useValue: mockCasbinService },
        { provide: AppLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSystemPermissions', () => {
    it('should return the predefined system permissions object', async () => {
      const permissions = await service.getSystemPermissions();
      expect(permissions).toEqual(SYSTEM_PERMISSIONS);
    });
  });

  describe('getPermissionsForRole', () => {
    it('should call enforcer.getFilteredPolicy with correct arguments', async () => {
      const mockPermissions = [['admin', 'tenant1', 'users', 'read']];
      mockEnforcer.getFilteredPolicy.mockResolvedValue(mockPermissions);

      const result = await service.getPermissionsForRole('admin', 'tenant1');

      expect(mockEnforcer.getFilteredPolicy).toHaveBeenCalledWith(
        0,
        'admin',
        'tenant1',
      );
      expect(result).toEqual(mockPermissions);
    });
  });

  describe('updatePermissionsForRole', () => {
    it('should remove old policies and add new ones', async () => {
      const updateDto = {
        roleName: 'developer',
        tenantId: 'tenant2',
        permissions: [
          { resource: 'project', action: 'read' },
          { resource: 'project', action: 'write' },
        ],
      };

      await service.updatePermissionsForRole(updateDto);

      // 验证删除旧策略的方法被调用
      expect(mockEnforcer.removeFilteredPolicy).toHaveBeenCalledWith(
        0,
        'developer',
        'tenant2',
      );

      // 验证添加新策略的方法被调用
      const expectedNewPolicies = [
        ['developer', 'tenant2', 'project', 'read'],
        ['developer', 'tenant2', 'project', 'write'],
      ];
      expect(mockEnforcer.addPolicies).toHaveBeenCalledWith(
        expectedNewPolicies,
      );

      // 验证保存策略的方法被调用
      expect(mockEnforcer.savePolicy).toHaveBeenCalled();
    });

    it('should only remove policies if permissions array is empty', async () => {
      const updateDto = {
        roleName: 'guest',
        tenantId: 'tenant3',
        permissions: [],
      };

      await service.updatePermissionsForRole(updateDto);

      expect(mockEnforcer.removeFilteredPolicy).toHaveBeenCalledWith(
        0,
        'guest',
        'tenant3',
      );
      expect(mockEnforcer.addPolicies).not.toHaveBeenCalled();
      expect(mockEnforcer.savePolicy).toHaveBeenCalled();
    });
  });
});
