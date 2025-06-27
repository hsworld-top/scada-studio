import { Test, TestingModule } from '@nestjs/testing';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

describe('TenantController', () => {
  let controller: TenantController;
  let service: TenantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantController],
      providers: [
        {
          provide: TenantService,
          useValue: {
            createTenant: jest.fn(),
            updateTenant: jest.fn(),
            deleteTenant: jest.fn(),
            findTenantById: jest.fn(),
            findAllTenants: jest.fn(),
            changeStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TenantController>(TenantController);
    service = module.get<TenantService>(TenantService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // 可补充 create、update、delete、findById、findAll、changeStatus 等接口的集成测试
});
