import { OpenAlexEnvConfigReader } from './openalex-env-config.reader';

describe('OpenAlexEnvConfigReader', () => {
  it('reads the journal priority percentage when it is between 1 and 99', () => {
    const reader = new OpenAlexEnvConfigReader({
      get: (name: string) =>
        name === 'OPENALEX_JOURNAL_PRIORITY_PERCENT' ? '65' : undefined,
    } as never);

    expect(reader.getJournalSyncConfig().priorityPercent).toBe(65);
  });

  it('falls back to 80 when the journal priority percentage is outside 1 through 99', () => {
    const reader = new OpenAlexEnvConfigReader({
      get: (name: string) =>
        name === 'OPENALEX_JOURNAL_PRIORITY_PERCENT' ? '100' : undefined,
    } as never);

    expect(reader.getJournalSyncConfig().priorityPercent).toBe(80);
  });

  it('reads the high-impact journal threshold and related-work limit', () => {
    const reader = new OpenAlexEnvConfigReader({
      get: (name: string) =>
        ({
          OPENALEX_JOURNAL_CITATION_THRESHOLD: '500',
          OPENALEX_JOURNAL_BACKFILL_FROM_YEAR: '2023',
          OPENALEX_JOURNAL_BACKFILL_TO_YEAR: '2025',
          OPENALEX_RELATED_WORK_LIMIT: '20',
        })[name],
    } as never);

    expect(reader.getJournalSyncConfig()).toMatchObject({
      journalCitationThreshold: 500,
      journalBackfillFromYear: 2023,
      journalBackfillToYear: 2025,
      relatedWorkLimit: 20,
    });
  });
});
