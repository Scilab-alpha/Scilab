import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';

async function bootstrapWorker() {
  const app = await NestFactory.createApplicationContext(AppModule);
  app.enableShutdownHooks();
}

void bootstrapWorker();
