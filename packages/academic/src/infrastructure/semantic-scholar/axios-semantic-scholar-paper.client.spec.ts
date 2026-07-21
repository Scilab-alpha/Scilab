import { AxiosResponse } from 'axios';
import { AxiosSemanticScholarPaperClient } from './axios-semantic-scholar-paper.client';

describe('AxiosSemanticScholarPaperClient', () => {
  it('uses authenticated bulk search with venue, date sorting, and requested fields', async () => {
    const client = new AxiosSemanticScholarPaperClient();
    const get = jest.fn().mockResolvedValue({
      data: { token: 'next-token', data: [{ paperId: 'paper-1' }] },
    } as AxiosResponse);
    (client as unknown as { http: { get: typeof get } }).http = { get };

    await expect(
      client.searchBulk({
        config: {
          apiKey: 'secret',
          baseUrl: 'https://api.semanticscholar.org',
          requestsPerSecond: 10_000,
        },
        venue: 'Journal of Tests',
        fromYear: 2020,
        sort: 'publicationDate:desc',
        token: 'cursor',
      }),
    ).resolves.toEqual({ token: 'next-token', data: [{ paperId: 'paper-1' }] });

    const [, request] = get.mock.calls[0] as [string, Record<string, any>];
    expect(request.headers).toEqual({ 'x-api-key': 'secret' });
    expect(request.params).toMatchObject({
      query: '',
      venue: 'Journal of Tests',
      publicationTypes: 'JournalArticle',
      publicationDateOrYear: '2020:',
      sort: 'publicationDate:desc',
      token: 'cursor',
    });
  });

  it('requests at most 500 recommendations for one quality seed', async () => {
    const client = new AxiosSemanticScholarPaperClient();
    const post = jest.fn().mockResolvedValue({
      data: { recommendedPapers: [{ paperId: 'related-1' }] },
    } as AxiosResponse);
    (client as unknown as { http: { post: typeof post } }).http = { post };

    await client.getRecommendations({
      config: {
        apiKey: 'secret',
        baseUrl: 'https://api.semanticscholar.org',
        requestsPerSecond: 10_000,
      },
      positivePaperId: 'seed-1',
      limit: 1_000,
    });

    const [, body, request] = post.mock.calls[0] as [
      string,
      Record<string, unknown>,
      Record<string, any>,
    ];
    expect(body).toEqual({
      positivePaperIds: ['seed-1'],
      negativePaperIds: [],
    });
    expect(request.params.limit).toBe(500);
    expect(request.headers).toEqual({ 'x-api-key': 'secret' });
  });

  it('retries throttled requests after Retry-After', async () => {
    const client = new AxiosSemanticScholarPaperClient();
    const throttled = {
      isAxiosError: true,
      response: {
        status: 429,
        headers: { 'retry-after': '0' },
        data: { message: 'retry later' },
      },
    };
    const get = jest
      .fn()
      .mockRejectedValueOnce(throttled)
      .mockResolvedValueOnce({ data: { data: [] } } as AxiosResponse);
    (client as unknown as { http: { get: typeof get } }).http = { get };

    await client.searchBulk({
      config: {
        apiKey: 'do-not-log-this-key',
        baseUrl: 'https://api.semanticscholar.org',
        requestsPerSecond: 10_000,
      },
      venue: 'Journal of Tests',
      fromYear: 2020,
      sort: 'citationCount:desc',
    });

    expect(get).toHaveBeenCalledTimes(2);
  });

  it('does not expose the API key when a terminal request fails', async () => {
    const client = new AxiosSemanticScholarPaperClient();
    const apiKey = 'do-not-log-this-key';
    const get = jest.fn().mockRejectedValue({
      isAxiosError: true,
      response: { status: 401, data: { message: 'Unauthorized' } },
    });
    (client as unknown as { http: { get: typeof get } }).http = { get };

    await expect(
      client.searchBulk({
        config: {
          apiKey,
          baseUrl: 'https://api.semanticscholar.org',
          requestsPerSecond: 10_000,
        },
        venue: 'Journal of Tests',
        fromYear: 2020,
        sort: 'publicationDate:desc',
      }),
    ).rejects.toThrow('HTTP 401');
    await expect(
      client.searchBulk({
        config: {
          apiKey,
          baseUrl: 'https://api.semanticscholar.org',
          requestsPerSecond: 10_000,
        },
        venue: 'Journal of Tests',
        fromYear: 2020,
        sort: 'publicationDate:desc',
      }),
    ).rejects.not.toThrow(apiKey);
  });
});
