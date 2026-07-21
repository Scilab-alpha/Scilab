import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Neo4jAcademicGraphRepository } from '@repo/academic/adapters';
import { PrismaModule, PrismaService } from '@repo/database';
import { Neo4jModule } from '@repo/neo4j';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    Neo4jModule,
    PrismaModule,
  ],
  providers: [Neo4jAcademicGraphRepository],
})
class InitializationModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(InitializationModule);
  try {
    await app.get(Neo4jAcademicGraphRepository).ensureSchema();
    const prisma = app.get(PrismaService);
    const states = await prisma.academicJournalSyncState.findMany({
      where: { openAlexJournalId: { not: null } },
      select: {
        openAlexJournalId: true,
        createdAt: true,
        updatedAt: true,
        lastResolvedAt: true,
        lastSuccessfulAt: true,
      },
    });
    await app.get(Neo4jAcademicGraphRepository).backfillJournalCrawlTimestamps(
      states.flatMap((state) => {
        if (!state.openAlexJournalId) {
          return [];
        }
        const lastSyncedAt = [
          state.lastResolvedAt,
          state.lastSuccessfulAt,
          state.updatedAt,
        ].reduce<Date | null>((latest, value) => {
          if (!value || (latest && latest >= value)) {
            return latest;
          }
          return value;
        }, null);
        return [
          {
            openAlexJournalId: state.openAlexJournalId,
            firstCrawledAt: state.createdAt,
            lastSyncedAt,
          },
        ];
      }),
    );
  } finally {
    await app.close();
  }
}

void bootstrap();
