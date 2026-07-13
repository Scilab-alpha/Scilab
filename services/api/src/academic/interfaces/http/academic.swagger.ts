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
    'citationCount',
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
    citationCount: { type: 'integer', nullable: true, minimum: 0 },
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

const authorListItemSchema = {
  type: 'object',
  required: ['id', 'orcid', 'displayName', 'imageUrl', 'articleCount'],
  additionalProperties: false,
  properties: {
    id: { type: 'string' },
    orcid: nullableStringSchema,
    displayName: nullableStringSchema,
    imageUrl: nullableStringSchema,
    articleCount: { type: 'integer', minimum: 0, example: 12 },
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

const authorListResponseSchema = envelopeSchema(
  {
    type: 'object',
    required: ['items', 'nextCursor'],
    additionalProperties: false,
    properties: {
      items: { type: 'array', items: authorListItemSchema },
      nextCursor: { type: 'string', nullable: true },
    },
  },
  'Authors retrieved',
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
const authorResponseSchema = envelopeSchema(
  authorListItemSchema,
  'Author retrieved',
);
const journalResponseSchema = envelopeSchema(
  journalSchema,
  'Journal retrieved',
);
const invalidCursorSchema = errorEnvelopeSchema(
  'limit must be an integer between 1 and 100',
);
const invalidArticleListCursorSchema = errorEnvelopeSchema(
  'cursor is invalid for this article query',
);
const invalidArticleListQuerySchema = {
  oneOf: [invalidCursorSchema, invalidArticleListCursorSchema],
};
const articleNotFoundSchema = errorEnvelopeSchema('Article not found');
const authorNotFoundSchema = errorEnvelopeSchema('Author not found');
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
    ApiOperation({
      summary: 'Search and filter academic articles with cursor pagination',
    }),
    ApiQuery({
      name: 'q',
      required: false,
      schema: { type: 'string', maxLength: 200 },
      description: 'Search article titles, abstracts, keywords, and topics.',
    }),
    ApiQuery({
      name: 'keywordId',
      required: false,
      schema: { type: 'string' },
      description: 'Require an exact related keyword id.',
    }),
    ApiQuery({
      name: 'topicId',
      required: false,
      schema: { type: 'string' },
      description: 'Require an exact related topic id.',
    }),
    ApiQuery({
      name: 'authorId',
      required: false,
      schema: { type: 'string' },
      description: 'Require an exact author id.',
    }),
    ApiQuery({
      name: 'journalId',
      required: false,
      schema: { type: 'string' },
      description: 'Require an exact journal id.',
    }),
    ApiQuery({
      name: 'publicationYear',
      required: false,
      schema: { type: 'integer', minimum: 1000 },
      description:
        'Exact publication year; mutually exclusive with year range.',
    }),
    ApiQuery({
      name: 'publicationYearFrom',
      required: false,
      schema: { type: 'integer', minimum: 1000 },
      description: 'Inclusive publication year lower bound.',
    }),
    ApiQuery({
      name: 'publicationYearTo',
      required: false,
      schema: { type: 'integer', minimum: 1000 },
      description: 'Inclusive publication year upper bound.',
    }),
    ApiQuery({
      name: 'publisher',
      required: false,
      schema: { type: 'string', maxLength: 255 },
      description: 'Publisher name matched exactly after normalization.',
    }),
    ApiQuery({
      name: 'country',
      required: false,
      schema: { type: 'string', minLength: 2, maxLength: 2 },
      description: 'ISO 3166-1 alpha-2 journal country code.',
    }),
    ApiQuery({
      name: 'sort',
      required: false,
      schema: {
        type: 'string',
        enum: ['relevant', 'newest', 'most_cited'],
      },
      description:
        'Defaults to relevant for research queries and newest otherwise.',
    }),
    ApiCursorQuery(),
    ApiOkResponse({
      description: 'Articles retrieved',
      schema: articleListResponseSchema,
    }),
    ApiBadRequestResponse({
      description: 'Article list query is invalid',
      schema: invalidArticleListQuerySchema,
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

export function ApiListAuthors() {
  return applyDecorators(
    ApiOperation({
      summary: 'List academic authors with cursor pagination',
    }),
    ApiCursorQuery(),
    ApiOkResponse({
      description: 'Authors retrieved',
      schema: authorListResponseSchema,
    }),
  );
}

export function ApiGetAuthor() {
  return applyDecorators(
    ApiOperation({ summary: 'Return one academic author by id' }),
    ApiParam({
      name: 'authorId',
      required: true,
      schema: { type: 'string' },
    }),
    ApiOkResponse({
      description: 'Author retrieved',
      schema: authorResponseSchema,
    }),
    ApiNotFoundResponse({
      description: 'Author not found',
      schema: authorNotFoundSchema,
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
