import { Injectable } from '@nestjs/common';
import axios, { type AxiosInstance } from 'axios';
import {
  FetchOpenAlexWorksInput,
  FetchOpenAlexWorksByIdsInput,
  OpenAlexWorksPage,
  OpenAlexWorkSource,
} from '@/academic/application/ports/openalex-work-source.port';

@Injectable()
export class AxiosOpenAlexWorksClient implements OpenAlexWorkSource {
  private readonly http: AxiosInstance = axios.create({
    timeout: 30_000,
    headers: {
      Accept: 'application/json',
    },
  });

  async fetchWorks(input: FetchOpenAlexWorksInput): Promise<OpenAlexWorksPage> {
    const { config } = input;
    const response = await this.getWorksPage(config);

    return {
      meta: response.data.meta,
      results: response.data.results ?? [],
    };
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

    try {
      const response = await this.http.get<OpenAlexWorksPage>('/works', {
        baseURL: input.config.baseUrl,
        params: {
          api_key: input.config.apiKey,
          filter: `openalex_id:${input.ids.join('|')}`,
          per_page: input.ids.length,
          select: 'id,cited_by_count',
        },
      });

      return {
        meta: response.data.meta,
        results: response.data.results ?? [],
      };
    } catch (error) {
      throw new Error(formatOpenAlexError(error));
    }
  }

  private async getWorksPage(config: FetchOpenAlexWorksInput['config']) {
    try {
      return await this.http.get<OpenAlexWorksPage>('/works', {
        baseURL: config.baseUrl,
        params: {
          api_key: config.apiKey,
          filter: config.filter,
          sort: config.sort,
          per_page: config.perPage,
        },
      });
    } catch (error) {
      throw new Error(formatOpenAlexError(error));
    }
  }
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
