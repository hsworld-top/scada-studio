import { Injectable } from '@nestjs/common';

@Injectable()
export class ProjectStudioService {
  getHello(): string {
    return 'Hello World!';
  }
}
