import { Test, TestingModule } from '@nestjs/testing';
import { WebscoketMngGateway } from './webscoket-mng.gateway';

describe('WebscoketMngGateway', () => {
  let gateway: WebscoketMngGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebscoketMngGateway],
    }).compile();

    gateway = module.get<WebscoketMngGateway>(WebscoketMngGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
