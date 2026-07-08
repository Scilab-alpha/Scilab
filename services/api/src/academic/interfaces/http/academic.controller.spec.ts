import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvalidArticleKeywordCursorError } from '@/academic/domain/academic-graph.model';
import { AcademicController } from '@/academic/interfaces/http/academic.controller';

describe('AcademicController', () => {
  it('trims article keyword queries before listing articles', async () => {
    const execute = jest
      .fn()
      .mockResolvedValue({ items: [], nextCursor: null });
    const controller = createController({ listArticlesExecute: execute });

    await expect(
      controller.findArticles({ keyword: ' machine learning ', limit: '20' }),
    ).resolves.toMatchObject({
      data: { items: [], nextCursor: null },
    });

    expect(execute).toHaveBeenCalledWith({
      cursor: null,
      keyword: 'machine learning',
      limit: 20,
    });
  });

  it('treats empty article keywords as a normal cursor list request', async () => {
    const execute = jest
      .fn()
      .mockResolvedValue({ items: [], nextCursor: null });
    const controller = createController({ listArticlesExecute: execute });

    await controller.findArticles({ keyword: '   ', limit: '10' });

    expect(execute).toHaveBeenCalledWith({
      cursor: null,
      keyword: null,
      limit: 10,
    });
  });

  it('maps invalid keyword cursors to bad request responses', async () => {
    const controller = createController({
      listArticlesExecute: jest
        .fn()
        .mockRejectedValue(new InvalidArticleKeywordCursorError()),
    });

    await expect(
      controller.findArticles({
        cursor: 'invalid-cursor',
        keyword: 'machine learning',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
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
}) {
  return new AcademicController(
    { execute: listArticlesExecute ?? jest.fn() } as never,
    { execute: jest.fn() } as never,
    { execute: listAuthorsExecute } as never,
    { execute: getAuthorByIdExecute } as never,
    { execute: jest.fn() } as never,
    { execute: jest.fn() } as never,
  );
}
