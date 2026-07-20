import { AcademicPipelineScheduler } from './academic-pipeline.scheduler';
import { ACADEMIC_PIPELINE_QUEUES } from '@repo/academic-queue';

describe('AcademicPipelineScheduler', () => {
  it('enqueues each pipeline stage instead of executing data work inline', async () => {
    const enqueue = jest.fn().mockResolvedValue('job-id');
    const scheduler = new AcademicPipelineScheduler({ enqueue } as never);

    await scheduler.enqueueScimagoReload();
    await scheduler.enqueueJournalSourceSync();
    await scheduler.enqueueJournalArticleSync();
    await scheduler.enqueueRelatedWorkSync();
    await scheduler.enqueueRelatedWorkHydration();
    await scheduler.enqueueOutgoingReference();
    await scheduler.enqueueReferenceHydration();
    await scheduler.enqueueIncomingCitation();
    await scheduler.enqueueCitationCountRefresh();

    expect(enqueue).toHaveBeenCalledTimes(9);
    expect(enqueue).toHaveBeenNthCalledWith(
      1,
      ACADEMIC_PIPELINE_QUEUES.scimagoReload,
      expect.any(Date),
    );
    expect(enqueue).toHaveBeenNthCalledWith(
      2,
      ACADEMIC_PIPELINE_QUEUES.journalSourceSync,
      expect.any(Date),
    );
    expect(enqueue).toHaveBeenNthCalledWith(
      3,
      ACADEMIC_PIPELINE_QUEUES.journalArticleSync,
      expect.any(Date),
    );
    expect(enqueue).toHaveBeenNthCalledWith(
      4,
      ACADEMIC_PIPELINE_QUEUES.relatedWorkSync,
      expect.any(Date),
    );
    expect(enqueue).toHaveBeenNthCalledWith(
      5,
      ACADEMIC_PIPELINE_QUEUES.relatedWorkHydration,
      expect.any(Date),
    );
    expect(enqueue).toHaveBeenNthCalledWith(
      6,
      ACADEMIC_PIPELINE_QUEUES.outgoingReference,
      expect.any(Date),
    );
    expect(enqueue).toHaveBeenNthCalledWith(
      7,
      ACADEMIC_PIPELINE_QUEUES.referenceHydration,
      expect.any(Date),
    );
    expect(enqueue).toHaveBeenNthCalledWith(
      8,
      ACADEMIC_PIPELINE_QUEUES.incomingCitation,
      expect.any(Date),
    );
    expect(enqueue).toHaveBeenNthCalledWith(
      9,
      ACADEMIC_PIPELINE_QUEUES.citationCountRefresh,
      expect.any(Date),
    );
  });
});
