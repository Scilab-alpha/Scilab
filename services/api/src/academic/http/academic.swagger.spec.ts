import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test, TestingModule } from '@nestjs/testing';
import {
  GetArticleByIdUseCase,
  GetAuthorByIdUseCase,
  GetJournalByIdUseCase,
  ListArticlesUseCase,
  ListAuthorsUseCase,
  ListJournalRankingsUseCase,
  ListJournalsUseCase,
} from '@repo/academic/query';
import { AcademicController } from '@/academic/http/academic.controller';

describe('Academic OpenAPI contract', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AcademicController],
      providers: [
        { provide: ListArticlesUseCase, useValue: { execute: jest.fn() } },
        { provide: GetArticleByIdUseCase, useValue: { execute: jest.fn() } },
        { provide: ListAuthorsUseCase, useValue: { execute: jest.fn() } },
        { provide: GetAuthorByIdUseCase, useValue: { execute: jest.fn() } },
        { provide: ListJournalsUseCase, useValue: { execute: jest.fn() } },
        { provide: GetJournalByIdUseCase, useValue: { execute: jest.fn() } },
        {
          provide: ListJournalRankingsUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('documents the complete article query and public response fields', () => {
    const swaggerDocument = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Scilab API').addBearerAuth().build(),
    );
    const articleList = swaggerDocument.paths['/academic/articles']?.get;
    const parameterNames = (articleList?.parameters ?? [])
      .map((parameter) => ('name' in parameter ? parameter.name : null))
      .filter((name): name is string => name !== null);

    expect(parameterNames).toEqual(
      expect.arrayContaining([
        'q',
        'keywordId',
        'topicId',
        'authorId',
        'journalId',
        'publicationYear',
        'publicationYearFrom',
        'publicationYearTo',
        'publisher',
        'country',
        'sort',
        'cursor',
        'limit',
      ]),
    );
    expect(parameterNames).not.toContain('region');
    expect(articleList?.responses?.['200']).toBeDefined();
    expect(articleList?.responses?.['400']).toBeDefined();

    const articleContract = JSON.stringify(articleList);
    expect(articleContract).toContain('citationCount');
    expect(articleContract).not.toContain('region');
  });

  it('documents the year-bound journal ranking response', () => {
    const swaggerDocument = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Scilab API').addBearerAuth().build(),
    );
    const rankingList =
      swaggerDocument.paths['/academic/journal-rankings']?.get;
    const parameterNames = (rankingList?.parameters ?? [])
      .map((parameter) => ('name' in parameter ? parameter.name : null))
      .filter((name): name is string => name !== null);

    expect(parameterNames).toEqual(
      expect.arrayContaining(['year', 'cursor', 'limit']),
    );
    expect(rankingList?.responses?.['200']).toBeDefined();
    expect(rankingList?.responses?.['400']).toBeDefined();
    expect(rankingList?.responses?.['404']).toBeDefined();

    const rankingContract = JSON.stringify(rankingList);
    expect(rankingContract).toContain('totalDocs');
    expect(rankingContract).toContain('totalDocs3Years');
    expect(rankingContract).toContain('totalRefs');
    expect(rankingContract).toContain('totalCitations3Years');
    expect(rankingContract).toContain('citableDocs3Years');
    expect(rankingContract).toContain('citationsPerDoc2Years');
    expect(rankingContract).toContain('refsPerDoc');
    expect(rankingContract).toContain('femalePercentage');
    expect(rankingContract).toContain('countryCode');
    expect(rankingContract).toContain('scimagoSourceId');
    expect(rankingContract).toContain('journalId');
    expect(rankingContract).toContain('matchStatus');
  });
});
