import { NestFactory } from '@nestjs/core';
import { IamServiceModule } from './iam-service.module';

async function bootstrap() {
  const app = await NestFactory.create(IamServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
