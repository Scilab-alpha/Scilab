import { Injectable } from '@nestjs/common';
import axios, { type AxiosInstance } from 'axios';
import {
  OpenAlexSourcesCatalog,
  OpenAlexSourcesPage,
} from '@/academic/application/ports/openalex-source.port';
import { requestOpenAlex } from '@/academic/infrastructure/openalex/axios-openalex-works.client';

@Injectable()
export class AxiosOpenAlexSourcesClient implements OpenAlexSourcesCatalog {
  private readonly http: AxiosInstance = axios.create({
    timeout: 30_000,
    headers: { Accept: 'application/json' },
  });

  async fetchSourcesByIssns(input: {
    config: { apiKey?: string; baseUrl: string };
    issns: string[];
  }): Promise<OpenAlexSourcesPage> {
    if (input.issns.length === 0) {
      return { results: [] };
    }
    if (input.issns.length > 100) {
      throw new Error('OpenAlex ISSN batches must not exceed 100 ISSNs');
    }

    try {
      const response = await requestOpenAlex(() =>
        this.http.get<OpenAlexSourcesPage>('/sources', {
          baseURL: input.config.baseUrl,
          params: {
            api_key: input.config.apiKey,
            filter: `issn:${input.issns.join('|')}`,
            per_page: input.issns.length,
          },
        }),
      );

      return { results: response.data.results ?? [] };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        throw new Error(
          `OpenAlex sources request failed${status ? `: HTTP ${status}` : ''}`,
        );
      }
      throw error;
    }
  }
}
