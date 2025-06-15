import { Controller, Get } from '@nestjs/common';
import { ProjectStudioService } from './project-studio.service';

@Controller()
export class ProjectStudioController {
  constructor(private readonly projectStudioService: ProjectStudioService) {}

  @Get()
  getHello(): string {
    return this.projectStudioService.getHello();
  }
}
