import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvalidArticleListCursorError } from '@/academic/domain/academic-graph.model';
import { AcademicController } from '@/academic/interfaces/http/academic.controller';

describe('AcademicController', () => {
  it('normalizes article queries before listing articles', async () => {
    const execute = jest
      .fn()
      .mockResolvedValue({ items: [], nextCursor: null });
    const controller = createController({ listArticlesExecute: execute });

    await expect(
      controller.findArticles({
        q: ' machine learning ',
        publisher: '  SciLab   Press ',
        country: 'us',
        limit: '20',
      }),
    ).resolves.toMatchObject({
      data: { items: [], nextCursor: null },
    });

    expect(execute).toHaveBeenCalledWith({
      cursor: null,
      q: 'machine learning',
      keywordId: null,
      topicId: null,
      authorId: null,
      journalId: null,
      publicationYear: null,
      publicationYearFrom: null,
      publicationYearTo: null,
      publisher: 'scilab press',
      country: 'US',
      limit: 20,
      sort: 'relevant',
    });
  });

  it('defaults empty searches to newest', async () => {
    const execute = jest
      .fn()
      .mockResolvedValue({ items: [], nextCursor: null });
    const controller = createController({ listArticlesExecute: execute });

    await controller.findArticles({ q: '   ', limit: '10' });

    expect(execute).toHaveBeenCalledWith({
      cursor: null,
      q: null,
      keywordId: null,
      topicId: null,
      authorId: null,
      journalId: null,
      publicationYear: null,
      publicationYearFrom: null,
      publicationYearTo: null,
      publisher: null,
      country: null,
      limit: 10,
      sort: 'newest',
    });
  });

  it('maps invalid article cursors to bad request responses', async () => {
    const controller = createController({
      listArticlesExecute: jest
        .fn()
        .mockRejectedValue(new InvalidArticleListCursorError()),
    });

    await expect(
      controller.findArticles({
        cursor: 'invalid-cursor',
        q: 'machine learning',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects conflicting exact and range publication years', async () => {
    const controller = createController();

    await expect(
      controller.findArticles({
        publicationYear: '2025',
        publicationYearFrom: '2020',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects relevant sorting without a research query', async () => {
    const controller = createController();

    await expect(
      controller.findArticles({ sort: 'relevant' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each([
    { country: 'USA' },
    { sort: 'citation_count' },
    { publicationYearFrom: '2025', publicationYearTo: '2020' },
  ])('rejects invalid article list query values', async (query) => {
    const controller = createController();

    await expect(controller.findArticles(query)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('passes exact filters and a valid year range to the use case', async () => {
    const execute = jest
      .fn()
      .mockResolvedValue({ items: [], nextCursor: null });
    const controller = createController({ listArticlesExecute: execute });

    await controller.findArticles({
      authorId: 'author-1',
      journalId: 'journal-1',
      keywordId: 'keyword-1',
      topicId: 'topic-1',
      publicationYearFrom: '2020',
      publicationYearTo: '2025',
      sort: 'most_cited',
    });

    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        authorId: 'author-1',
        journalId: 'journal-1',
        keywordId: 'keyword-1',
        topicId: 'topic-1',
        publicationYearFrom: 2020,
        publicationYearTo: 2025,
        sort: 'most_cited',
      }),
    );
  });

  it('lists authors with cursor pagination', async () => {
    const execute = jest
      .fn()
      .mockResolvedValue({ items: [], nextCursor: null });
    const controller = createController({ listAuthorsExecute: execute });

    await expect(
      controller.findAuthors({
        cursor: 'author-1',
        limit: '5',
      }),
    ).resolves.toMatchObject({
      data: { items: [], nextCursor: null },
    });

    expect(execute).toHaveBeenCalledWith({
      cursor: 'author-1',
      limit: 5,
    });
  });

  it('returns an author by id', async () => {
    const execute = jest.fn().mockResolvedValue({
      id: 'author-1',
      displayName: 'Ada Lovelace',
      articleCount: 3,
    });
    const controller = createController({ getAuthorByIdExecute: execute });

    await expect(controller.findAuthor('author-1')).resolves.toMatchObject({
      data: {
        id: 'author-1',
        displayName: 'Ada Lovelace',
        articleCount: 3,
      },
    });
    expect(execute).toHaveBeenCalledWith({ authorId: 'author-1' });
  });

  it('maps missing authors to not found responses', async () => {
    const controller = createController({
      getAuthorByIdExecute: jest.fn().mockResolvedValue(null),
    });

    await expect(
      controller.findAuthor('missing-author'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

function createController({
  listArticlesExecute,
  listAuthorsExecute = jest.fn(),
  getAuthorByIdExecute = jest.fn(),
}: {
  listArticlesExecute?: jest.Mock;
  listAuthorsExecute?: jest.Mock;
  getAuthorByIdExecute?: jest.Mock;
} = {}) {
  return new AcademicController(
    { execute: listArticlesExecute ?? jest.fn() } as never,
    { execute: jest.fn() } as never,
    { execute: listAuthorsExecute } as never,
    { execute: getAuthorByIdExecute } as never,
    { execute: jest.fn() } as never,
    { execute: jest.fn() } as never,
  );
}
