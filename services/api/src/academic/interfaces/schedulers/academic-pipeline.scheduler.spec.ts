import { AcademicPipelineScheduler } from '@/academic/interfaces/schedulers/academic-pipeline.scheduler';
import { ACADEMIC_PIPELINE_QUEUES } from '@/academic/infrastructure/queue/academic-pipeline.queue';

describe('AcademicPipelineScheduler', () => {
  it('enqueues each pipeline stage instead of executing data work inline', async () => {
    const enqueue = jest.fn().mockResolvedValue('job-id');
    const scheduler = new AcademicPipelineScheduler({ enqueue } as never);

    await scheduler.enqueueScimagoReload();
    await scheduler.enqueueArticleSync();
    await scheduler.enqueueReferenceHydration();
    await scheduler.enqueueIncomingCitation();
    await scheduler.enqueueCitationCountRefresh();

    expect(enqueue).toHaveBeenCalledTimes(5);
    expect(enqueue).toHaveBeenNthCalledWith(
      1,
      ACADEMIC_PIPELINE_QUEUES.scimagoReload,
      expect.any(Date),
    );
    expect(enqueue).toHaveBeenNthCalledWith(
      2,
      ACADEMIC_PIPELINE_QUEUES.articleSync,
      expect.any(Date),
    );
    expect(enqueue).toHaveBeenNthCalledWith(
      3,
      ACADEMIC_PIPELINE_QUEUES.referenceHydration,
      expect.any(Date),
    );
    expect(enqueue).toHaveBeenNthCalledWith(
      4,
      ACADEMIC_PIPELINE_QUEUES.incomingCitation,
      expect.any(Date),
    );
    expect(enqueue).toHaveBeenNthCalledWith(
      5,
      ACADEMIC_PIPELINE_QUEUES.citationCountRefresh,
      expect.any(Date),
    );
  });
});
