import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
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

const objectTypeSchema = {
  type: 'string',
  enum: ['AUTHOR', 'JOURNAL', 'KEYWORD', 'TOPIC'],
};

const notifyModeSchema = {
  type: 'string',
  enum: ['IN_APP', 'DAILY_EMAIL', 'WEEKLY_EMAIL', 'OFF'],
};

const objectIdSchema = {
  type: 'string',
  maxLength: 128,
  example: 'S123456789',
};

const targetSchema = {
  type: 'object',
  required: ['type', 'id', 'displayName'],
  additionalProperties: false,
  properties: {
    type: objectTypeSchema,
    id: objectIdSchema,
    displayName: { type: 'string', nullable: true },
    sourceId: { type: 'string', nullable: true },
    journalType: { type: 'string', nullable: true },
    country: { type: 'string', nullable: true },
    region: { type: 'string', nullable: true },
    score: { type: 'number', nullable: true },
  },
};

const listSchema = envelopeSchema(
  {
    type: 'object',
    required: ['items', 'page', 'limit', 'hasMore'],
    additionalProperties: false,
    properties: {
      items: {
        type: 'array',
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
            objectType: objectTypeSchema,
            objectId: objectIdSchema,
            notifyMode: notifyModeSchema,
            followedAt: { type: 'string', format: 'date-time' },
            target: targetSchema,
          },
        },
      },
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 20 },
      hasMore: { type: 'boolean', example: false },
    },
  },
  'Follows retrieved',
);

const toggleSchema = envelopeSchema(
  {
    type: 'object',
    required: ['objectType', 'objectId', 'followed'],
    additionalProperties: false,
    properties: {
      objectType: objectTypeSchema,
      objectId: objectIdSchema,
      followed: { type: 'boolean' },
      notifyMode: notifyModeSchema,
      followedAt: { type: 'string', format: 'date-time' },
    },
  },
  'Follow toggled',
);

const updateSchema = envelopeSchema(
  {
    type: 'object',
    required: [
      'followId',
      'objectType',
      'objectId',
      'notifyMode',
      'followedAt',
    ],
    additionalProperties: false,
    properties: {
      followId: { type: 'string', format: 'uuid' },
      objectType: objectTypeSchema,
      objectId: objectIdSchema,
      notifyMode: notifyModeSchema,
      followedAt: { type: 'string', format: 'date-time' },
    },
  },
  'Follow notification mode updated',
);

const unauthorizedSchema = errorEnvelopeSchema('Authentication failed');
const badRequestSchema = errorEnvelopeSchema('Follow input is invalid');
const notFoundSchema = errorEnvelopeSchema('Follow target not found');

function ApiFollowBearerAuth() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Authentication failed',
      schema: unauthorizedSchema,
    }),
  );
}

export function ApiListFollows() {
  return applyDecorators(
    ApiFollowBearerAuth(),
    ApiOperation({ summary: 'List current user follows' }),
    ApiQuery({ name: 'type', required: false, schema: objectTypeSchema }),
    ApiQuery({
      name: 'page',
      required: false,
      schema: { type: 'integer', minimum: 1, default: 1 },
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    }),
    ApiOkResponse({ description: 'Follows retrieved', schema: listSchema }),
    ApiBadRequestResponse({
      description: 'Follow input is invalid',
      schema: badRequestSchema,
    }),
  );
}

export function ApiToggleFollow() {
  return applyDecorators(
    ApiFollowBearerAuth(),
    ApiOperation({
      summary: 'Toggle follow for an author, journal, keyword, or topic',
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['objectType', 'objectId'],
        additionalProperties: false,
        properties: {
          objectType: objectTypeSchema,
          objectId: objectIdSchema,
          notifyMode: notifyModeSchema,
        },
      },
    }),
    ApiOkResponse({ description: 'Follow toggled', schema: toggleSchema }),
    ApiBadRequestResponse({
      description: 'Follow input is invalid',
      schema: badRequestSchema,
    }),
    ApiNotFoundResponse({
      description: 'Follow target not found',
      schema: notFoundSchema,
    }),
  );
}

export function ApiPatchFollowNotifyMode() {
  return applyDecorators(
    ApiFollowBearerAuth(),
    ApiOperation({ summary: 'Update notification mode for a followed target' }),
    ApiParam({ name: 'objectType', schema: objectTypeSchema }),
    ApiParam({ name: 'objectId', schema: objectIdSchema }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['notifyMode'],
        additionalProperties: false,
        properties: { notifyMode: notifyModeSchema },
      },
    }),
    ApiOkResponse({
      description: 'Follow notification mode updated',
      schema: updateSchema,
    }),
    ApiBadRequestResponse({
      description: 'Follow input is invalid',
      schema: badRequestSchema,
    }),
    ApiNotFoundResponse({
      description: 'Follow not found',
      schema: errorEnvelopeSchema('Follow not found'),
    }),
  );
}
