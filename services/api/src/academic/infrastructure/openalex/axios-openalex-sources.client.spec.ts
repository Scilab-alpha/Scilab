import { AxiosOpenAlexSourcesClient } from './axios-openalex-sources.client';

describe('AxiosOpenAlexSourcesClient', () => {
  it('uses one exact-ISSN Sources request for batches of at most 100 ISSNs', async () => {
    const get = jest
      .fn()
      .mockResolvedValue({ data: { results: [{ id: 'S1' }] } });
    const client = new AxiosOpenAlexSourcesClient();
    (client as unknown as { http: { get: typeof get } }).http.get = get;
    const issns = Array.from({ length: 100 }, (_, index) => `0000-${index}`);

    await expect(
      client.fetchSourcesByIssns({
        config: { apiKey: 'key', baseUrl: 'https://api.openalex.org' },
        issns,
      }),
    ).resolves.toEqual({ results: [{ id: 'S1' }] });
    const [path, options] = get.mock.calls[0] as unknown as [
      string,
      { params: { api_key: string; filter: string; per_page: number } },
    ];
    expect(path).toBe('/sources');
    expect(options.params).toEqual({
      api_key: 'key',
      filter: `issn:${issns.join('|')}`,
      per_page: 100,
    });
  });

  it('rejects batches larger than 100 and skips empty batches', async () => {
    const client = new AxiosOpenAlexSourcesClient();
    await expect(
      client.fetchSourcesByIssns({
        config: { baseUrl: 'https://api.openalex.org' },
        issns: [],
      }),
    ).resolves.toEqual({ results: [] });
    await expect(
      client.fetchSourcesByIssns({
        config: { baseUrl: 'https://api.openalex.org' },
        issns: Array.from({ length: 101 }, (_, index) => String(index)),
      }),
    ).rejects.toThrow('must not exceed 100');
  });
});
