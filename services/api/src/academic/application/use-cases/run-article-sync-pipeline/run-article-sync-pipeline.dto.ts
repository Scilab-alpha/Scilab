import { ExecuteOpenAlexSyncOutput } from '@/academic/application/use-cases/execute-openalex-sync/execute-openalex-sync.dto';

export interface RunArticleSyncPipelineOutput {
  runs: ExecuteOpenAlexSyncOutput[];
  initialBackfillComplete: boolean;
}
