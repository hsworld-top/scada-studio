import { Test, TestingModule } from '@nestjs/testing';
import { ProjectStudioController } from './project-studio.controller';
import { ProjectStudioService } from './project-studio.service';

describe('ProjectStudioController', () => {
  let projectStudioController: ProjectStudioController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ProjectStudioController],
      providers: [ProjectStudioService],
    }).compile();

    projectStudioController = app.get<ProjectStudioController>(ProjectStudioController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(projectStudioController.getHello()).toBe('Hello World!');
    });
  });
});
