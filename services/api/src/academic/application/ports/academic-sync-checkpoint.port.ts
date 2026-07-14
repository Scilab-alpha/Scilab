export const ACADEMIC_SYNC_CHECKPOINT_REPOSITORY = Symbol(
  'ACADEMIC_SYNC_CHECKPOINT_REPOSITORY',
);

export interface AcademicSyncCheckpoint {
  cursor: string | null;
  initialBackfillComplete: boolean;
  lastSuccessfulAt: Date | null;
}

export interface AcademicSyncCheckpointRepository {
  getArticleSyncCheckpoint(): Promise<AcademicSyncCheckpoint>;
  saveArticleSyncCheckpoint(checkpoint: AcademicSyncCheckpoint): Promise<void>;
}
