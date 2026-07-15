import { Injectable } from '@nestjs/common';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
  FetchOpenAlexWorksInput,
  FetchOpenAlexWorksByIdsInput,
  FetchOpenAlexCitingWorksInput,
  OpenAlexWorksPage,
  OpenAlexWorkSource,
} from '@repo/academic/application/ports/openalex-work-source.port';

@Injectable()
export class AxiosOpenAlexWorksClient implements OpenAlexWorkSource {
  private readonly http: AxiosInstance = axios.create({
    timeout: 30_000,
    headers: {
      Accept: 'application/json',
    },
  });

  async fetchWorks(input: FetchOpenAlexWorksInput): Promise<OpenAlexWorksPage> {
    const response = await this.getWorksPage(input);

    return {
      meta: response.data.meta,
      results: response.data.results ?? [],
    };
  }

  async fetchWorkDetailsByIds(
    input: FetchOpenAlexWorksByIdsInput,
  ): Promise<OpenAlexWorksPage> {
    return this.fetchByIds(input);
  }

  async fetchWorksByIds(
    input: FetchOpenAlexWorksByIdsInput,
  ): Promise<OpenAlexWorksPage> {
    if (input.ids.length === 0) {
      return { results: [] };
    }

    if (input.ids.length > 100) {
      throw new Error('OpenAlex work id batches must not exceed 100 ids');
    }

    return this.fetchByIds(input, 'id,cited_by_count');
  }

  async fetchRelatedWorksByIds(
    input: FetchOpenAlexWorksByIdsInput,
  ): Promise<OpenAlexWorksPage> {
    return this.fetchByIds(input, 'id,type,related_works');
  }

  async fetchCitingWorks(
    input: FetchOpenAlexCitingWorksInput,
  ): Promise<OpenAlexWorksPage> {
    try {
      const response = await requestOpenAlex(() =>
        this.http.get<OpenAlexWorksPage>('/works', {
          baseURL: input.config.baseUrl,
          params: {
            api_key: input.config.apiKey,
            filter: `cites:${input.workId}`,
            sort: 'publication_date:desc',
            per_page: input.limit,
          },
        }),
      );

      return {
        meta: response.data.meta,
        results: response.data.results ?? [],
      };
    } catch (error) {
      throw new Error(formatOpenAlexError(error));
    }
  }

  private async getWorksPage(input: FetchOpenAlexWorksInput) {
    const { config } = input;
    try {
      return await requestOpenAlex(() =>
        this.http.get<OpenAlexWorksPage>('/works', {
          baseURL: config.baseUrl,
          params: {
            api_key: config.apiKey,
            filter: config.filter,
            sort: config.sort,
            per_page: config.perPage,
            cursor: input.cursor ?? undefined,
          },
        }),
      );
    } catch (error) {
      throw new Error(formatOpenAlexError(error));
    }
  }

  private async fetchByIds(
    input: FetchOpenAlexWorksByIdsInput,
    select?: string,
  ): Promise<OpenAlexWorksPage> {
    if (input.ids.length === 0) {
      return { results: [] };
    }

    if (input.ids.length > 100) {
      throw new Error('OpenAlex work id batches must not exceed 100 ids');
    }

    try {
      const response = await requestOpenAlex(() =>
        this.http.get<OpenAlexWorksPage>('/works', {
          baseURL: input.config.baseUrl,
          params: {
            api_key: input.config.apiKey,
            filter: `openalex:${input.ids.join('|')}`,
            per_page: input.ids.length,
            select,
          },
        }),
      );

      return {
        meta: response.data.meta,
        results: response.data.results ?? [],
      };
    } catch (error) {
      throw new Error(formatOpenAlexError(error));
    }
  }
}

export async function requestOpenAlex<T>(
  request: () => Promise<AxiosResponse<T>>,
): Promise<AxiosResponse<T>> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await request();
    } catch (error) {
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;
      const isRetryable =
        status === 429 || (status !== undefined && status >= 500);
      if (!isRetryable || attempt === maxAttempts) {
        throw error;
      }
      await delay(retryAfterMilliseconds(error, attempt));
    }
  }
  throw new Error('OpenAlex request retries were exhausted');
}

function retryAfterMilliseconds(error: unknown, attempt: number): number {
  const retryAfter = axios.isAxiosError(error)
    ? readHeader(error.response?.headers, 'retry-after')
    : undefined;
  const seconds =
    typeof retryAfter === 'string' ? Number(retryAfter) : Number(retryAfter);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }
  if (typeof retryAfter === 'string') {
    const retryAt = Date.parse(retryAfter);
    if (Number.isFinite(retryAt)) {
      return Math.max(0, retryAt - Date.now());
    }
  }
  return Math.min(1000 * 2 ** (attempt - 1), 10_000);
}

function readHeader(value: unknown, name: string): string | number | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const header = (value as Record<string, unknown>)[name];
  return typeof header === 'string' || typeof header === 'number'
    ? header
    : undefined;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function formatOpenAlexError(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Unknown OpenAlex error';
  }

  const status = error.response?.status;
  const statusText = error.response?.statusText;
  const data: unknown = error.response?.data;
  const responseMessage = formatOpenAlexResponseData(data);

  return [
    'OpenAlex request failed',
    status ? `HTTP ${status}` : undefined,
    statusText,
    responseMessage,
  ]
    .filter(Boolean)
    .join(': ');
}

function formatOpenAlexResponseData(data: unknown): string | undefined {
  if (!data) {
    return undefined;
  }

  if (typeof data === 'string') {
    return data;
  }

  if (
    typeof data === 'number' ||
    typeof data === 'boolean' ||
    typeof data === 'bigint'
  ) {
    return data.toString();
  }

  if (typeof data !== 'object') {
    return undefined;
  }

  const response = data as { error?: unknown; message?: unknown };
  const error = typeof response.error === 'string' ? response.error : undefined;
  const message =
    typeof response.message === 'string' ? response.message : undefined;

  return [error, message].filter(Boolean).join(' - ') || stringifyJson(data);
}

function stringifyJson(data: unknown): string | undefined {
  try {
    return JSON.stringify(data);
  } catch {
    return undefined;
  }
}
