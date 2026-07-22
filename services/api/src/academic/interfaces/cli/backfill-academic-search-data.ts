import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { BackfillAcademicSearchDataUseCase } from '@/academic/application/use-cases/backfill-academic-search-data/backfill-academic-search-data.use-case';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const backfill = app.get(BackfillAcademicSearchDataUseCase);
    const output = await backfill.execute();
    console.info(JSON.stringify(output, null, 2));
  } finally {
    await app.close();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
