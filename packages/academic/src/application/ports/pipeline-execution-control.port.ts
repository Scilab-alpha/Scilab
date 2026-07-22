/**
 * A transport-neutral checkpoint used by long-running academic use cases.
 * Callers check it only between durable pages or batches so cancellation never
 * abandons a partial page write.
 */
export interface PipelineExecutionControl {
  isCancellationRequested(): Promise<boolean>;
  reportProgress?(progress: {
    current: number;
    total?: number | null;
  }): Promise<void>;
}
