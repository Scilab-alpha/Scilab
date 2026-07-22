import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test, TestingModule } from '@nestjs/testing';
import { GetArticleGraphUseCase } from '@/visualize/application/use-cases/get-article-graph/get-article-graph.use-case';
import { ArticleGraphController } from '@/visualize/interfaces/http/article-graph.controller';

describe('Article graph OpenAPI contract', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ArticleGraphController],
      providers: [
        { provide: GetArticleGraphUseCase, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('documents the public graph route with complete success and failure responses', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Scilab API').addBearerAuth().build(),
    );
    const get = document.paths['/academic/graphs/article/{id}']?.get;
    const parameterNames = (get?.parameters ?? [])
      .map((parameter) => ('name' in parameter ? parameter.name : null))
      .filter((name): name is string => name !== null);

    expect(parameterNames).toEqual(
      expect.arrayContaining(['id', 'cursor', 'limit']),
    );
    expect(get?.responses?.['200']).toBeDefined();
    expect(get?.responses?.['400']).toBeDefined();
    expect(get?.responses?.['404']).toBeDefined();
    expect(get?.responses?.['500']).toBeDefined();
    expect(JSON.stringify(get)).toContain('RELATED_TO');
    expect(JSON.stringify(get)).not.toContain('PUBLISHED_IN_YEAR');
    expect(JSON.stringify(get)).toContain('Machine Learning... (2024)');
    expect(JSON.stringify(get)).toContain('citationCount');
  });
});
