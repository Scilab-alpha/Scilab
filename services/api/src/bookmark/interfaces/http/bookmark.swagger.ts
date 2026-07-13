import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
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

const articleSchema = {
  type: 'object',
  additionalProperties: true,
  required: ['id', 'title'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string' },
    abstract: { type: 'string', nullable: true },
    doi: { type: 'string', nullable: true },
    publicationYear: { type: 'integer', nullable: true },
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
          required: ['articleId', 'bookmarkedAt', 'article'],
          additionalProperties: false,
          properties: {
            articleId: { type: 'string', format: 'uuid' },
            bookmarkedAt: { type: 'string', format: 'date-time' },
            article: articleSchema,
          },
        },
      },
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 20 },
      hasMore: { type: 'boolean', example: false },
    },
  },
  'Bookmarks retrieved',
);

const toggleSchema = envelopeSchema(
  {
    type: 'object',
    required: ['articleId', 'bookmarked'],
    additionalProperties: false,
    properties: {
      articleId: { type: 'string', format: 'uuid' },
      bookmarked: { type: 'boolean' },
      bookmarkedAt: { type: 'string', format: 'date-time' },
    },
  },
  'Bookmark toggled',
);

const unauthorizedSchema = errorEnvelopeSchema('Authentication failed');
const badRequestSchema = errorEnvelopeSchema('articleId is invalid');
const notFoundSchema = errorEnvelopeSchema('Article not found');

function ApiBookmarkBearerAuth() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Authentication failed',
      schema: unauthorizedSchema,
    }),
  );
}

export function ApiListBookmarks() {
  return applyDecorators(
    ApiBookmarkBearerAuth(),
    ApiOperation({ summary: 'List current user bookmarks' }),
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
    ApiOkResponse({ description: 'Bookmarks retrieved', schema: listSchema }),
    ApiBadRequestResponse({
      description: 'Pagination query is invalid',
      schema: errorEnvelopeSchema('limit must be at most 100'),
    }),
  );
}

export function ApiToggleBookmark() {
  return applyDecorators(
    ApiBookmarkBearerAuth(),
    ApiOperation({ summary: 'Toggle a bookmark for one article' }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['articleId'],
        additionalProperties: false,
        properties: { articleId: { type: 'string', format: 'uuid' } },
      },
    }),
    ApiOkResponse({ description: 'Bookmark toggled', schema: toggleSchema }),
    ApiBadRequestResponse({
      description: 'articleId is invalid',
      schema: badRequestSchema,
    }),
    ApiNotFoundResponse({
      description: 'Article not found',
      schema: notFoundSchema,
    }),
  );
}
