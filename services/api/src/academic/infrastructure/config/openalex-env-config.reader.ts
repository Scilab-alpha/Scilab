import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OpenAlexConfigReader,
  OpenAlexSyncConfig,
} from '@/academic/application/ports/openalex-config.port';

const OPENALEX_API_KEY_CONFIG_KEY = 'OPENALEX_API_KEY';
const OPENALEX_API_BASE_URL_CONFIG_KEY = 'OPENALEX_API_BASE_URL';
const OPENALEX_SYNC_FILTER_CONFIG_KEY = 'OPENALEX_SYNC_FILTER';
const OPENALEX_SYNC_SORT_CONFIG_KEY = 'OPENALEX_SYNC_SORT';
const OPENALEX_SYNC_PER_PAGE_CONFIG_KEY = 'OPENALEX_SYNC_PER_PAGE';

const DEFAULT_OPENALEX_API_BASE_URL = 'https://api.openalex.org';
const DEFAULT_OPENALEX_SYNC_SORT = 'publication_year:desc';
const DEFAULT_OPENALEX_SYNC_PER_PAGE = 25;
const MAX_OPENALEX_SYNC_PER_PAGE = 100;

@Injectable()
export class OpenAlexEnvConfigReader implements OpenAlexConfigReader {
  constructor(private readonly configService: ConfigService) {}

  getSyncConfig(): OpenAlexSyncConfig {
    return {
      apiKey: this.readOptionalString(OPENALEX_API_KEY_CONFIG_KEY),
      baseUrl:
        this.readOptionalString(OPENALEX_API_BASE_URL_CONFIG_KEY) ??
        DEFAULT_OPENALEX_API_BASE_URL,
      filter: this.readOptionalString(OPENALEX_SYNC_FILTER_CONFIG_KEY),
      sort:
        this.readOptionalString(OPENALEX_SYNC_SORT_CONFIG_KEY) ??
        DEFAULT_OPENALEX_SYNC_SORT,
      perPage: this.readPerPage(),
    };
  }

  private readOptionalString(name: string): string | undefined {
    const value = this.configService.get<string>(name);

    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : undefined;
  }

  private readPerPage(): number {
    const rawValue = this.configService.get<string>(
      OPENALEX_SYNC_PER_PAGE_CONFIG_KEY,
    );

    if (!rawValue) {
      return DEFAULT_OPENALEX_SYNC_PER_PAGE;
    }

    const perPage = Number(rawValue);

    if (!Number.isInteger(perPage) || perPage <= 0) {
      return DEFAULT_OPENALEX_SYNC_PER_PAGE;
    }

    return Math.min(perPage, MAX_OPENALEX_SYNC_PER_PAGE);
  }
}
