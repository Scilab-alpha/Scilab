import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  SemanticScholarBulkSearchInput,
  SemanticScholarBulkSearchPage,
  SemanticScholarPaperSource,
  SemanticScholarRecommendationsInput,
  SemanticScholarRecommendationsPage,
} from '@repo/academic/application/ports/semantic-scholar.port';

const RETRYABLE_CODES = new Set([
  'EAI_AGAIN',
  'ECONNABORTED',
  'ECONNRESET',
  'ENOTFOUND',
  'EPIPE',
  'ERR_BAD_RESPONSE',
  'ERR_NETWORK',
  'ETIMEDOUT',
]);

@Injectable()
export class AxiosSemanticScholarPaperClient implements SemanticScholarPaperSource {
  private readonly http: AxiosInstance = axios.create({
    timeout: 30_000,
    headers: { Accept: 'application/json' },
  });
  private nextRequestAt = 0;

  async searchBulk(
    input: SemanticScholarBulkSearchInput,
  ): Promise<SemanticScholarBulkSearchPage> {
    const response = await this.request(
      input.config.requestsPerSecond ?? 1,
      () =>
        this.http.get<SemanticScholarBulkSearchPage>(
          '/graph/v1/paper/search/bulk',
          {
            baseURL: input.config.baseUrl,
            headers: apiKeyHeader(input.config.apiKey),
            params: {
              query: '',
              venue: input.venue,
              publicationTypes: 'JournalArticle',
              publicationDateOrYear: `${input.fromYear}:`,
              sort: input.sort,
              fields:
                'paperId,externalIds,title,abstract,year,publicationDate,citationCount,publicationTypes,venue,publicationVenue',
              token: input.token ?? undefined,
            },
          },
        ),
    );
    return {
      token: response.data.token ?? null,
      data: response.data.data ?? [],
    };
  }

  async getRecommendations(
    input: SemanticScholarRecommendationsInput,
  ): Promise<SemanticScholarRecommendationsPage> {
    const response = await this.request(
      input.config.requestsPerSecond ?? 1,
      () =>
        this.http.post<SemanticScholarRecommendationsPage>(
          '/recommendations/v1/papers/',
          { positivePaperIds: [input.positivePaperId], negativePaperIds: [] },
          {
            baseURL: input.config.baseUrl,
            headers: apiKeyHeader(input.config.apiKey),
            params: {
              limit: Math.min(Math.max(1, input.limit), 500),
              fields:
                'paperId,externalIds,title,abstract,year,publicationDate,citationCount,publicationTypes,venue,publicationVenue',
            },
          },
        ),
    );
    return { recommendedPapers: response.data.recommendedPapers ?? [] };
  }

  private async request<T>(
    requestsPerSecond: number,
    operation: () => Promise<AxiosResponse<T>>,
  ): Promise<AxiosResponse<T>> {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await this.waitForRateLimit(requestsPerSecond);
      try {
        return await operation();
      } catch (error) {
        if (!isRetryable(error) || attempt === 3) {
          throw new Error(formatError(error));
        }
        await delay(retryAfterMilliseconds(error, attempt));
      }
    }
    throw new Error('Semantic Scholar request retries were exhausted');
  }

  private async waitForRateLimit(requestsPerSecond: number): Promise<void> {
    const now = Date.now();
    const wait = Math.max(0, this.nextRequestAt - now);
    this.nextRequestAt =
      Math.max(now, this.nextRequestAt) +
      Math.ceil(1_000 / Math.max(1, requestsPerSecond));
    if (wait > 0) {
      await delay(wait);
    }
  }
}

function apiKeyHeader(apiKey?: string): Record<string, string> {
  return apiKey ? { 'x-api-key': apiKey } : {};
}

function isRetryable(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }
  const status = error.response?.status;
  const code = error.code;
  return (
    status === 429 ||
    (status !== undefined && status >= 500) ||
    (code !== undefined && RETRYABLE_CODES.has(code))
  );
}

function retryAfterMilliseconds(error: unknown, attempt: number): number {
  const value = axios.isAxiosError(error)
    ? error.response?.headers?.['retry-after']
    : undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1_000;
  }
  if (typeof value === 'string') {
    const retryAt = Date.parse(value);
    if (Number.isFinite(retryAt)) {
      return Math.max(0, retryAt - Date.now());
    }
  }
  return Math.min(1_000 * 2 ** (attempt - 1), 10_000);
}

function formatError(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return `Semantic Scholar request failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
  const status = error.response?.status;
  const message =
    typeof error.response?.data === 'object'
      ? JSON.stringify(error.response.data)
      : error.message;
  return [
    'Semantic Scholar request failed',
    status ? `HTTP ${status}` : null,
    message,
  ]
    .filter(Boolean)
    .join(': ');
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
