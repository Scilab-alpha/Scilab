import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Neo4jAcademicGraphRepository } from '@repo/academic/adapters';
import { Neo4jModule } from '@repo/neo4j';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), Neo4jModule],
  providers: [Neo4jAcademicGraphRepository],
})
class InitializationModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(InitializationModule);
  try {
    await app.get(Neo4jAcademicGraphRepository).ensureSchema();
  } finally {
    await app.close();
  }
}

void bootstrap();
