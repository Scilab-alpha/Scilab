import { AxiosOpenAlexSourcesClient } from './axios-openalex-sources.client';
import { formatOpenAlexError } from './axios-openalex-works.client';

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

  it('retries a temporary DNS error before returning sources', async () => {
    jest.useFakeTimers();

    try {
      const dnsError = Object.assign(
        new Error('getaddrinfo EAI_AGAIN api.openalex.org'),
        { isAxiosError: true, code: 'EAI_AGAIN' },
      );
      const get = jest
        .fn()
        .mockRejectedValueOnce(dnsError)
        .mockResolvedValue({ data: { results: [{ id: 'S1' }] } });
      const client = new AxiosOpenAlexSourcesClient();
      (client as unknown as { http: { get: typeof get } }).http.get = get;

      const result = client.fetchSourcesByIssns({
        config: { baseUrl: 'https://api.openalex.org' },
        issns: ['1542-4863'],
      });

      await jest.runAllTimersAsync();

      await expect(result).resolves.toEqual({ results: [{ id: 'S1' }] });
      expect(get).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it('retains Axios diagnostics when a Sources request ultimately fails', () => {
    const error = Object.assign(new Error('stream truncated'), {
      isAxiosError: true,
      code: 'ERR_BAD_RESPONSE',
      response: { status: 200, statusText: 'OK' },
    });

    expect(formatOpenAlexError(error, 'OpenAlex sources request failed')).toBe(
      'OpenAlex sources request failed: HTTP 200: code ERR_BAD_RESPONSE: OK: stream truncated',
    );
  });
});
