import {
  ACADEMIC_PIPELINE_QUEUES,
  AcademicPipelineQueueProducer,
} from './academic-pipeline.queue';

describe('AcademicPipelineQueueProducer', () => {
  it('uses a versioned payload and one deterministic job id per queue-minute', async () => {
    const add = jest.fn().mockResolvedValue({ id: 'bull-job-id' });
    const queue = { add };
    const producer = new AcademicPipelineQueueProducer(
      queue as never,
      queue as never,
      queue as never,
      queue as never,
      queue as never,
      queue as never,
      queue as never,
      queue as never,
      queue as never,
      queue as never,
    );

    await producer.enqueue(
      ACADEMIC_PIPELINE_QUEUES.journalArticleSync,
      new Date('2026-07-15T04:00:47.123Z'),
    );
    await producer.enqueue(
      ACADEMIC_PIPELINE_QUEUES.journalArticleSync,
      new Date('2026-07-15T04:00:59.999Z'),
    );

    expect(add).toHaveBeenCalledTimes(2);
    expect(add).toHaveBeenNthCalledWith(
      1,
      'run',
      {
        schemaVersion: 1,
        scheduledAt: '2026-07-15T04:00:00.000Z',
      },
      { jobId: 'journal-article-sync-202607150400' },
    );
    expect(add.mock.calls[1][2]).toEqual({
      jobId: 'journal-article-sync-202607150400',
    });
  });
});
