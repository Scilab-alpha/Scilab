import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

const nullableStringSchema = { type: 'string', nullable: true };

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

function errorSchema(message: string) {
  return envelopeSchema(
    { type: 'object', additionalProperties: false, example: {} },
    message,
    false,
  );
}

const graphResponseSchema = envelopeSchema(
  {
    type: 'object',
    required: ['nodes', 'edges', 'truncated', 'nextCursor'],
    additionalProperties: false,
    properties: {
      nodes: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'type', 'label'],
          additionalProperties: false,
          properties: {
            id: { type: 'string', example: 'article:W123' },
            type: { type: 'string', enum: ['article', 'year'] },
            label: { type: 'string', example: 'Machine Learning...' },
          },
        },
      },
      edges: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'sourceId', 'targetId', 'type'],
          additionalProperties: false,
          properties: {
            id: { type: 'string', example: 'article:W123->year:2024' },
            sourceId: { type: 'string' },
            targetId: { type: 'string' },
            type: {
              type: 'string',
              enum: ['RELATED_TO', 'PUBLISHED_IN_YEAR'],
            },
          },
        },
      },
      truncated: { type: 'boolean' },
      nextCursor: nullableStringSchema,
    },
  },
  'Article graph retrieved',
);

export function ApiGetArticleGraph() {
  return applyDecorators(
    ApiOperation({
      summary: 'Return a graph of OpenAlex related academic articles',
    }),
    ApiParam({
      name: 'id',
      required: true,
      schema: { type: 'string', example: 'W123' },
    }),
    ApiQuery({
      name: 'cursor',
      required: false,
      schema: { type: 'string' },
      description: 'Cursor returned by the previous graph page.',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      description:
        'Number of connected papers to return. Defaults to 20, maximum 100.',
    }),
    ApiOkResponse({
      description: 'Article graph retrieved',
      schema: graphResponseSchema,
    }),
    ApiBadRequestResponse({
      description: 'Graph cursor or limit is invalid',
      schema: errorSchema('cursor is invalid for this article graph'),
    }),
    ApiNotFoundResponse({
      description: 'Article not found',
      schema: errorSchema('Article not found'),
    }),
    ApiInternalServerErrorResponse({
      description: 'Graph retrieval failed',
      schema: errorSchema('Internal server error'),
    }),
  );
}
