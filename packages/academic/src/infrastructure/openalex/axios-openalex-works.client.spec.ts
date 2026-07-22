import { AxiosOpenAlexWorksClient } from '@repo/academic/infrastructure/openalex/axios-openalex-works.client';
import { OpenAlexWorksPage } from '@repo/academic/application/ports/openalex-work-source.port';
import { AxiosResponse } from 'axios';

describe('AxiosOpenAlexWorksClient related work fetches', () => {
  it('selects related_works and rejects batches larger than 100', async () => {
    const client = new AxiosOpenAlexWorksClient();
    const get = jest
      .fn<
        Promise<AxiosResponse<OpenAlexWorksPage>>,
        [string, { baseURL: string; params: Record<string, unknown> }]
      >()
      .mockResolvedValue({
        data: { results: [{ id: 'https://openalex.org/W1' }] },
      } as AxiosResponse<OpenAlexWorksPage>);
    (client as unknown as { http: { get: typeof get } }).http = { get };

    await expect(
      client.fetchRelatedWorksByIds({
        config: { apiKey: 'key', baseUrl: 'https://api.openalex.org' },
        ids: ['W1', 'W2'],
      }),
    ).resolves.toEqual({ results: [{ id: 'https://openalex.org/W1' }] });

    const request = get.mock.calls[0]?.[1];
    expect(request?.params).toMatchObject({
      filter: 'openalex:W1|W2',
      per_page: 2,
      select: 'id,type,related_works',
    });

    await expect(
      client.fetchRelatedWorksByIds({
        config: { apiKey: 'key', baseUrl: 'https://api.openalex.org' },
        ids: Array.from({ length: 101 }, (_, index) => `W${index}`),
      }),
    ).rejects.toThrow('must not exceed 100 ids');
  });
});
