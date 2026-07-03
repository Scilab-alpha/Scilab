import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
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

function errorEnvelopeSchema(message: string) {
  return envelopeSchema(
    {
      type: 'object',
      additionalProperties: false,
      example: {},
    },
    message,
    false,
  );
}

const nullableStringSchema = { type: 'string', nullable: true };

const journalSchema = {
  type: 'object',
  required: [
    'id',
    'sourceId',
    'displayName',
    'type',
    'isOpenAccess',
    'isOaDiamond',
    'coverage',
    'country',
    'region',
    'issnList',
    'publisherName',
    'publisherImageUrl',
    'subjectCategories',
    'articleCount',
  ],
  additionalProperties: false,
  properties: {
    id: { type: 'string', example: '77777777-7777-4777-8777-777777777771' },
    sourceId: nullableStringSchema,
    displayName: nullableStringSchema,
    type: nullableStringSchema,
    isOpenAccess: { type: 'boolean', nullable: true },
    isOaDiamond: { type: 'boolean', nullable: true },
    coverage: nullableStringSchema,
    country: nullableStringSchema,
    region: nullableStringSchema,
    issnList: {
      type: 'array',
      nullable: true,
      items: { type: 'string' },
    },
    publisherName: nullableStringSchema,
    publisherImageUrl: nullableStringSchema,
    subjectCategories: {
      type: 'array',
      nullable: true,
      items: { type: 'string' },
    },
    articleCount: { type: 'integer', minimum: 0, example: 12 },
  },
};

const articleNodeSchema = {
  type: 'object',
  required: [
    'id',
    'title',
    'abstract',
    'doi',
    'publicationYear',
    'version',
    'volumeNumber',
    'issueNumber',
    'createdAt',
    'updatedAt',
  ],
  additionalProperties: false,
  properties: {
    id: { type: 'string', example: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1' },
    title: { type: 'string', example: 'Benchmarking Neural Retrieval Models' },
    abstract: nullableStringSchema,
    doi: nullableStringSchema,
    publicationYear: { type: 'integer', nullable: true, example: 2025 },
    version: nullableStringSchema,
    volumeNumber: {
      oneOf: [{ type: 'integer' }, { type: 'string' }],
      nullable: true,
    },
    issueNumber: nullableStringSchema,
    createdAt: nullableStringSchema,
    updatedAt: nullableStringSchema,
  },
};

const authorSchema = {
  type: 'object',
  required: ['id', 'orcid', 'displayName', 'imageUrl', 'authorPosition'],
  additionalProperties: false,
  properties: {
    id: { type: 'string' },
    orcid: nullableStringSchema,
    displayName: nullableStringSchema,
    imageUrl: nullableStringSchema,
    authorPosition: { type: 'integer', nullable: true },
  },
};

const keywordSchema = {
  type: 'object',
  required: ['id', 'displayName', 'score'],
  additionalProperties: false,
  properties: {
    id: { type: 'string' },
    displayName: nullableStringSchema,
    score: { type: 'number', nullable: true },
  },
};

const topicSchema = {
  type: 'object',
  required: ['id', 'displayName', 'score', 'isPrimary'],
  additionalProperties: false,
  properties: {
    id: { type: 'string' },
    displayName: nullableStringSchema,
    score: { type: 'number', nullable: true },
    isPrimary: { type: 'boolean', nullable: true },
  },
};

const articleGraphSchema = {
  type: 'object',
  required: [
    'article',
    'journal',
    'authors',
    'keywords',
    'topics',
    'citedArticleIds',
  ],
  additionalProperties: false,
  properties: {
    article: articleNodeSchema,
    journal: {
      nullable: true,
      allOf: [
        {
          ...journalSchema,
          required: journalSchema.required.filter(
            (field) => field !== 'articleCount',
          ),
        },
      ],
    },
    authors: { type: 'array', items: authorSchema },
    keywords: { type: 'array', items: keywordSchema },
    topics: { type: 'array', items: topicSchema },
    citedArticleIds: { type: 'array', items: { type: 'string' } },
  },
};

const articleListResponseSchema = envelopeSchema(
  {
    type: 'object',
    required: ['items', 'nextCursor'],
    additionalProperties: false,
    properties: {
      items: { type: 'array', items: articleGraphSchema },
      nextCursor: { type: 'string', nullable: true },
    },
  },
  'Articles retrieved',
);

const journalListResponseSchema = envelopeSchema(
  {
    type: 'object',
    required: ['items', 'nextCursor'],
    additionalProperties: false,
    properties: {
      items: { type: 'array', items: journalSchema },
      nextCursor: { type: 'string', nullable: true },
    },
  },
  'Journals retrieved',
);

const articleResponseSchema = envelopeSchema(
  articleGraphSchema,
  'Article retrieved',
);
const journalResponseSchema = envelopeSchema(
  journalSchema,
  'Journal retrieved',
);
const invalidCursorSchema = errorEnvelopeSchema(
  'limit must be an integer between 1 and 100',
);
const articleNotFoundSchema = errorEnvelopeSchema('Article not found');
const journalNotFoundSchema = errorEnvelopeSchema('Journal not found');

function ApiCursorQuery() {
  return applyDecorators(
    ApiQuery({
      name: 'cursor',
      required: false,
      schema: { type: 'string' },
      description: 'Cursor returned by the previous page.',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      description: 'Number of records to return. Defaults to 20, maximum 100.',
    }),
    ApiBadRequestResponse({
      description: 'Cursor pagination query is invalid',
      schema: invalidCursorSchema,
    }),
  );
}

export function ApiListArticles() {
  return applyDecorators(
    ApiOperation({ summary: 'List academic articles with cursor pagination' }),
    ApiCursorQuery(),
    ApiOkResponse({
      description: 'Articles retrieved',
      schema: articleListResponseSchema,
    }),
  );
}

export function ApiGetArticle() {
  return applyDecorators(
    ApiOperation({ summary: 'Return one academic article by id' }),
    ApiParam({
      name: 'articleId',
      required: true,
      schema: { type: 'string' },
    }),
    ApiOkResponse({
      description: 'Article retrieved',
      schema: articleResponseSchema,
    }),
    ApiNotFoundResponse({
      description: 'Article not found',
      schema: articleNotFoundSchema,
    }),
  );
}

export function ApiListJournals() {
  return applyDecorators(
    ApiOperation({ summary: 'List academic journals with cursor pagination' }),
    ApiCursorQuery(),
    ApiOkResponse({
      description: 'Journals retrieved',
      schema: journalListResponseSchema,
    }),
  );
}

export function ApiGetJournal() {
  return applyDecorators(
    ApiOperation({ summary: 'Return one academic journal by id' }),
    ApiParam({
      name: 'journalId',
      required: true,
      schema: { type: 'string' },
    }),
    ApiOkResponse({
      description: 'Journal retrieved',
      schema: journalResponseSchema,
    }),
    ApiNotFoundResponse({
      description: 'Journal not found',
      schema: journalNotFoundSchema,
    }),
  );
}
