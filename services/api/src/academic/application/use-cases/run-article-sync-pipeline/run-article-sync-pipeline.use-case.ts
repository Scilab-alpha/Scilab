import { AcademicSyncCheckpointRepository } from '@/academic/application/ports/academic-sync-checkpoint.port';
import { OpenAlexConfigReader } from '@/academic/application/ports/openalex-config.port';
import { ExecuteOpenAlexSyncUseCase } from '@/academic/application/use-cases/execute-openalex-sync/execute-openalex-sync.use-case';
import { RunArticleSyncPipelineOutput } from '@/academic/application/use-cases/run-article-sync-pipeline/run-article-sync-pipeline.dto';

const MAX_PAGES_PER_RUN = 10;
const RECENT_PUBLICATION_DAYS = 30;

export class RunArticleSyncPipelineUseCase {
  constructor(
    private readonly configReader: OpenAlexConfigReader,
    private readonly checkpoints: AcademicSyncCheckpointRepository,
    private readonly sync: ExecuteOpenAlexSyncUseCase,
  ) {}

  async execute(): Promise<RunArticleSyncPipelineOutput> {
    const checkpoint = await this.checkpoints.getArticleSyncCheckpoint();

    if (!checkpoint.initialBackfillComplete) {
      const result = await this.sync.execute({
        cursor: checkpoint.cursor,
        maxPages: MAX_PAGES_PER_RUN,
      });

      if (result.status !== 'FAILED') {
        await this.checkpoints.saveArticleSyncCheckpoint({
          cursor: result.nextCursor,
          initialBackfillComplete: result.nextCursor === null,
          lastSuccessfulAt: new Date(),
        });
      }

      return {
        runs: [result],
        initialBackfillComplete:
          result.status !== 'FAILED' && result.nextCursor === null,
      };
    }

    const config = this.configReader.getSyncConfig();
    const now = new Date();
    const fromCreatedDate = formatDate(
      addDays(checkpoint.lastSuccessfulAt ?? now, -1),
    );
    const fromPublicationDate = formatDate(
      addDays(now, -RECENT_PUBLICATION_DAYS),
    );
    const createdRun = await this.sync.execute({
      maxPages: MAX_PAGES_PER_RUN,
      filter: appendFilter(
        config.filter,
        `from_created_date:${fromCreatedDate}`,
      ),
    });
    const recentRun = await this.sync.execute({
      maxPages: MAX_PAGES_PER_RUN,
      filter: appendFilter(
        config.filter,
        `from_publication_date:${fromPublicationDate}`,
      ),
    });
    const runs = [createdRun, recentRun];

    if (runs.every((run) => run.status !== 'FAILED')) {
      await this.checkpoints.saveArticleSyncCheckpoint({
        cursor: null,
        initialBackfillComplete: true,
        lastSuccessfulAt: now,
      });
    }

    return { runs, initialBackfillComplete: true };
  }
}

function appendFilter(base: string | undefined, extra: string): string {
  return [base, extra].filter(Boolean).join(',');
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}
