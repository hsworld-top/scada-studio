import { Module } from '@nestjs/common';
import { ProjectStudioController } from './project-studio.controller';
import { ProjectStudioService } from './project-studio.service';

@Module({
  imports: [],
  controllers: [ProjectStudioController],
  providers: [ProjectStudioService],
})
export class ProjectStudioModule {}
