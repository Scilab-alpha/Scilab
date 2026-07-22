import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

function envelopeSchema(
  data: Record<string, unknown>,
  message: string,
  success = true,
) {
  return {
    type: 'object',
    required: ['success', 'message', 'data'],
    additionalProperties: false,
    properties: {
      success: { type: 'boolean', example: success },
      message: { type: 'string', example: message },
      data,
    },
  };
}

const errorEnvelopeSchema = (message: string) =>
  envelopeSchema(
    { type: 'object', additionalProperties: false, example: {} },
    message,
    false,
  );

const articleSchema = {
  type: 'object',
  additionalProperties: true,
  required: ['id', 'title'],
  properties: {
    id: { type: 'string', example: 'W1234567890' },
    title: { type: 'string' },
    abstract: { type: 'string', nullable: true },
    doi: { type: 'string', nullable: true },
    publicationYear: { type: 'integer', nullable: true },
  },
};

const targetSchema = {
  type: 'object',
  required: ['type', 'id', 'displayName'],
  additionalProperties: false,
  properties: {
    type: { type: 'string', enum: ['AUTHOR', 'JOURNAL', 'KEYWORD', 'TOPIC'] },
    id: { type: 'string', maxLength: 128 },
    displayName: { type: 'string', nullable: true },
    sourceId: { type: 'string', nullable: true },
    journalType: { type: 'string', nullable: true },
    country: { type: 'string', nullable: true },
    region: { type: 'string', nullable: true },
    score: { type: 'number', nullable: true },
  },
};

const dashboardSchema = envelopeSchema(
  {
    type: 'object',
    required: [
      'bookmarkCount',
      'followCount',
      'recentBookmarks',
      'recentFollows',
      'ranking',
      'catalog',
      'publicationGrowth',
      'yearDistribution',
      'trendingTopics',
      'topJournals',
      'recentPublications',
    ],
    additionalProperties: false,
    properties: {
      bookmarkCount: { type: 'integer', minimum: 0 },
      followCount: { type: 'integer', minimum: 0 },
      recentBookmarks: {
        type: 'array',
        maxItems: 5,
        items: {
          type: 'object',
          required: ['articleId', 'bookmarkedAt', 'article'],
          additionalProperties: false,
          properties: {
            articleId: { type: 'string', example: 'W1234567890' },
            bookmarkedAt: { type: 'string', format: 'date-time' },
            article: articleSchema,
          },
        },
      },
      recentFollows: {
        type: 'array',
        maxItems: 5,
        items: {
          type: 'object',
          required: [
            'followId',
            'objectType',
            'objectId',
            'notifyMode',
            'followedAt',
            'target',
          ],
          additionalProperties: false,
          properties: {
            followId: { type: 'string', format: 'uuid' },
            objectType: {
              type: 'string',
              enum: ['AUTHOR', 'JOURNAL', 'KEYWORD', 'TOPIC'],
            },
            objectId: { type: 'string', maxLength: 128 },
            notifyMode: {
              type: 'string',
              enum: ['IN_APP', 'DAILY_EMAIL', 'WEEKLY_EMAIL', 'OFF'],
            },
            followedAt: { type: 'string', format: 'date-time' },
            target: targetSchema,
          },
        },
      },
      ranking: {
        type: 'object',
        required: ['year', 'metric'],
        additionalProperties: false,
        properties: {
          year: { type: 'integer', example: 2025 },
          metric: { type: 'string', enum: ['SJR'] },
        },
      },
      catalog: {
        type: 'object',
        required: [
          'journalCount',
          'articleCount',
          'uniqueKeywordCount',
          'topicsAndSubjectsCount',
          'asOf',
        ],
        additionalProperties: false,
        properties: {
          journalCount: { type: 'integer', minimum: 0 },
          articleCount: { type: 'integer', minimum: 0 },
          uniqueKeywordCount: { type: 'integer', minimum: 0 },
          topicsAndSubjectsCount: { type: 'integer', minimum: 0 },
          asOf: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      publicationGrowth: {
        type: 'array',
        items: {
          type: 'object',
          required: ['year', 'articles'],
          additionalProperties: false,
          properties: {
            year: { type: 'integer' },
            articles: { type: 'integer', minimum: 0 },
          },
        },
      },
      yearDistribution: {
        type: 'array',
        items: {
          type: 'object',
          required: ['year', 'articles'],
          additionalProperties: false,
          properties: {
            year: { type: 'integer' },
            articles: { type: 'integer', minimum: 0 },
          },
        },
      },
      trendingTopics: {
        type: 'array',
        maxItems: 5,
        items: {
          type: 'object',
          required: ['name', 'count', 'changePercent'],
          additionalProperties: false,
          properties: {
            name: { type: 'string' },
            count: { type: 'integer', minimum: 0 },
            changePercent: { type: 'number' },
          },
        },
      },
      topJournals: {
        type: 'array',
        maxItems: 5,
        items: {
          type: 'object',
          required: [
            'scimagoSourceId',
            'journalId',
            'title',
            'sjr',
            'hIndex',
            'totalDocs',
            'countryCode',
          ],
          additionalProperties: false,
          properties: {
            scimagoSourceId: { type: 'string' },
            journalId: { type: 'string', nullable: true },
            title: { type: 'string' },
            sjr: { type: 'number', nullable: true },
            hIndex: { type: 'integer', nullable: true },
            totalDocs: { type: 'integer', nullable: true },
            countryCode: { type: 'string', nullable: true },
          },
        },
      },
      recentPublications: {
        type: 'array',
        maxItems: 5,
        items: {
          type: 'object',
          required: [
            'id',
            'title',
            'journal',
            'publicationYear',
            'citationCount',
          ],
          additionalProperties: false,
          properties: {
            id: { type: 'string' },
            title: { type: 'string', nullable: true },
            journal: { type: 'string', nullable: true },
            publicationYear: { type: 'integer', nullable: true },
            citationCount: { type: 'integer', minimum: 0 },
          },
        },
      },
    },
  },
  'Dashboard retrieved',
);

export function ApiGetDashboard() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Get current user dashboard' }),
    ApiOkResponse({
      description: 'Dashboard retrieved',
      schema: dashboardSchema,
    }),
    ApiUnauthorizedResponse({
      description: 'Authentication failed',
      schema: errorEnvelopeSchema('Authentication failed'),
    }),
    ApiInternalServerErrorResponse({
      description: 'Dashboard request failed',
      schema: errorEnvelopeSchema('Dashboard request failed'),
    }),
    ApiServiceUnavailableResponse({
      description: 'Catalog or ranking data is unavailable',
      schema: errorEnvelopeSchema('Dashboard data is unavailable'),
    }),
  );
}
