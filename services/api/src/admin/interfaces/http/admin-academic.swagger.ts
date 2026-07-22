import { applyDecorators } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

const envelope = (data: Record<string, unknown>, message: string) => ({
  type: 'object',
  required: ['success', 'message', 'data'],
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: message },
    data,
  },
});

const failureEnvelope = (message: string) => ({
  type: 'object',
  required: ['success', 'message', 'data'],
  additionalProperties: false,
  properties: {
    success: { type: 'boolean', enum: [false], example: false },
    message: { type: 'string', example: message },
    data: {
      type: 'object',
      additionalProperties: true,
      example: { code: 'REQUEST_FAILED' },
    },
  },
});

const errors = () => [
  ApiBearerAuth(),
  ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    schema: failureEnvelope('Authentication is required.'),
  }),
  ApiForbiddenResponse({
    description: 'Admin role is required.',
    schema: failureEnvelope('Admin role is required.'),
  }),
  ApiBadRequestResponse({
    description: 'Request validation failed.',
    schema: failureEnvelope('Request validation failed.'),
  }),
  ApiNotFoundResponse({
    description: 'Requested resource was not found.',
    schema: failureEnvelope('Requested resource was not found.'),
  }),
  ApiConflictResponse({
    description: 'Job state transition is invalid.',
    schema: failureEnvelope('Job state transition is invalid.'),
  }),
  ApiServiceUnavailableResponse({
    description: 'Queue or audit storage is unavailable.',
    schema: failureEnvelope('Dashboard metrics are unavailable'),
  }),
  ApiInternalServerErrorResponse({
    description: 'The administration request could not be completed.',
    schema: failureEnvelope(
      'The administration request could not be completed.',
    ),
  }),
];

const dashboardGrowthWindowSchema = {
  type: 'object',
  required: ['articles', 'journals', 'authorsWithNewArticles'],
  properties: {
    articles: { type: 'integer', minimum: 0 },
    journals: { type: 'integer', minimum: 0 },
    authorsWithNewArticles: { type: 'integer', minimum: 0 },
  },
};

const dashboardMetricsSchema = {
  type: 'object',
  required: [
    'generatedAt',
    'articleCount',
    'journalCount',
    'authorCount',
    'userCount',
    'summary',
    'users',
    'engagement',
    'sync',
    'growth',
    'rankings',
    'dataQuality',
    'sources',
  ],
  additionalProperties: false,
  properties: {
    generatedAt: { type: 'string', format: 'date-time' },
    articleCount: { type: 'integer', minimum: 0, example: 125000 },
    journalCount: { type: 'integer', minimum: 0, example: 30412 },
    authorCount: { type: 'integer', minimum: 0, example: 90000 },
    userCount: { type: 'integer', minimum: 0, example: 128 },
    summary: {
      type: 'object',
      required: ['articleCount', 'journalCount', 'authorCount', 'userCount'],
      additionalProperties: false,
      properties: {
        articleCount: { type: 'integer', minimum: 0 },
        journalCount: { type: 'integer', minimum: 0 },
        authorCount: { type: 'integer', minimum: 0 },
        userCount: { type: 'integer', minimum: 0 },
      },
    },
    users: {
      type: 'object',
      required: ['byStatus', 'byRole', 'registrations'],
      additionalProperties: false,
      properties: {
        byStatus: {
          type: 'object',
          required: ['active', 'inactive', 'banned'],
          properties: {
            active: { type: 'integer', minimum: 0 },
            inactive: { type: 'integer', minimum: 0 },
            banned: { type: 'integer', minimum: 0 },
          },
        },
        byRole: {
          type: 'object',
          required: ['student', 'researcher', 'admin'],
          properties: {
            student: { type: 'integer', minimum: 0 },
            researcher: { type: 'integer', minimum: 0 },
            admin: { type: 'integer', minimum: 0 },
          },
        },
        registrations: {
          type: 'object',
          required: ['last7Days', 'last30Days'],
          properties: {
            last7Days: { type: 'integer', minimum: 0 },
            last30Days: { type: 'integer', minimum: 0 },
          },
        },
      },
    },
    engagement: {
      type: 'object',
      required: ['bookmarkCount', 'followCount', 'unreadNotificationCount'],
      properties: {
        bookmarkCount: { type: 'integer', minimum: 0 },
        followCount: { type: 'integer', minimum: 0 },
        unreadNotificationCount: { type: 'integer', minimum: 0 },
      },
    },
    sync: {
      type: 'object',
      required: [
        'runningJobCount',
        'failedSyncCountLast24Hours',
        'lastSyncAt',
        'recentLogs',
      ],
      properties: {
        runningJobCount: { type: 'integer', minimum: 0 },
        failedSyncCountLast24Hours: { type: 'integer', minimum: 0 },
        lastSyncAt: { type: 'string', format: 'date-time', nullable: true },
        recentLogs: {
          type: 'array',
          maxItems: 5,
          items: {
            type: 'object',
            required: [
              'id',
              'source',
              'jobType',
              'status',
              'startedAt',
              'finishedAt',
              'insertedCount',
              'updatedCount',
              'errorCount',
              'sourceName',
            ],
            properties: {
              id: { type: 'string', format: 'uuid' },
              source: { type: 'string' },
              jobType: { type: 'string' },
              status: { type: 'string' },
              startedAt: { type: 'string', format: 'date-time' },
              finishedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              insertedCount: { type: 'integer', minimum: 0 },
              updatedCount: { type: 'integer', minimum: 0 },
              errorCount: { type: 'integer', minimum: 0 },
              sourceName: { type: 'string' },
            },
          },
        },
      },
    },
    growth: {
      type: 'object',
      required: ['last7Days', 'last30Days'],
      properties: {
        last7Days: dashboardGrowthWindowSchema,
        last30Days: dashboardGrowthWindowSchema,
      },
    },
    rankings: {
      type: 'object',
      required: ['topJournals', 'topArticles'],
      properties: {
        topJournals: {
          type: 'array',
          maxItems: 5,
          items: {
            type: 'object',
            required: ['id', 'title', 'articleCount'],
            properties: {
              id: { type: 'string' },
              title: { type: 'string', nullable: true },
              articleCount: { type: 'integer', minimum: 0 },
            },
          },
        },
        topArticles: {
          type: 'array',
          maxItems: 5,
          items: {
            type: 'object',
            required: ['id', 'title', 'citationCount', 'publicationYear'],
            properties: {
              id: { type: 'string' },
              title: { type: 'string', nullable: true },
              citationCount: { type: 'integer', minimum: 0 },
              publicationYear: { type: 'integer', nullable: true },
            },
          },
        },
      },
    },
    dataQuality: {
      type: 'object',
      required: [
        'hydratedArticles',
        'placeholderArticles',
        'missingDoi',
        'missingAbstract',
        'missingAuthors',
      ],
      properties: {
        hydratedArticles: { type: 'integer', minimum: 0 },
        placeholderArticles: { type: 'integer', minimum: 0 },
        missingDoi: { type: 'integer', minimum: 0 },
        missingAbstract: { type: 'integer', minimum: 0 },
        missingAuthors: { type: 'integer', minimum: 0 },
      },
    },
    sources: {
      type: 'array',
      items: {
        type: 'object',
        required: [
          'id',
          'name',
          'isActive',
          'lastTestedAt',
          'latestSyncStatus',
          'latestSyncAt',
          'failedSyncCountLast24Hours',
        ],
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          isActive: { type: 'boolean' },
          lastTestedAt: { type: 'string', format: 'date-time', nullable: true },
          latestSyncStatus: { type: 'string', nullable: true },
          latestSyncAt: { type: 'string', format: 'date-time', nullable: true },
          failedSyncCountLast24Hours: { type: 'integer', minimum: 0 },
        },
      },
    },
  },
};

export function ApiAdminRead(summary: string, message: string) {
  return applyDecorators(
    ApiOperation({ summary }),
    ApiOkResponse({ schema: envelope({ type: 'object' }, message) }),
    ...errors(),
  );
}

export function ApiAdminDashboardMetrics() {
  return applyDecorators(
    ApiOperation({ summary: 'Get administration dashboard metrics' }),
    ApiOkResponse({
      schema: envelope(dashboardMetricsSchema, 'Dashboard metrics retrieved'),
    }),
    ...errors(),
  );
}

export function ApiAdminAction(
  summary: string,
  message: string,
  accepted = false,
) {
  return applyDecorators(
    ApiOperation({ summary }),
    accepted
      ? ApiAcceptedResponse({ schema: envelope({ type: 'object' }, message) })
      : ApiOkResponse({ schema: envelope({ type: 'object' }, message) }),
    ...errors(),
  );
}
