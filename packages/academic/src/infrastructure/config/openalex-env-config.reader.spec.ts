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
});
