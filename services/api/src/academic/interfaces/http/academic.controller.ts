import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetArticleByIdUseCase } from '@/academic/application/use-cases/get-article-by-id/get-article-by-id.use-case';
import { GetAuthorByIdUseCase } from '@/academic/application/use-cases/get-author-by-id/get-author-by-id.use-case';
import { GetJournalByIdUseCase } from '@/academic/application/use-cases/get-journal-by-id/get-journal-by-id.use-case';
import { ListArticlesUseCase } from '@/academic/application/use-cases/list-articles/list-articles.use-case';
import { ListAuthorsUseCase } from '@/academic/application/use-cases/list-authors/list-authors.use-case';
import { ListJournalsUseCase } from '@/academic/application/use-cases/list-journals/list-journals.use-case';
import {
  ArticleListInput,
  CursorPaginationInput,
  InvalidArticleKeywordCursorError,
} from '@/academic/domain/academic-graph.model';
import {
  AcademicArticleQueryDto,
  AcademicCursorQueryDto,
} from '@/academic/interfaces/http/academic.dto';
import {
  ApiGetArticle,
  ApiGetAuthor,
  ApiGetJournal,
  ApiListArticles,
  ApiListAuthors,
  ApiListJournals,
} from '@/academic/interfaces/http/academic.swagger';
import { createSuccessResponse } from '@/shared/response/response.factory';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@ApiTags('Academic')
@Controller('academic')
export class AcademicController {
  constructor(
    private readonly listArticles: ListArticlesUseCase,
    private readonly getArticleById: GetArticleByIdUseCase,
    private readonly listAuthors: ListAuthorsUseCase,
    private readonly getAuthorById: GetAuthorByIdUseCase,
    private readonly listJournals: ListJournalsUseCase,
    private readonly getJournalById: GetJournalByIdUseCase,
  ) {}

  @Get('articles')
  @ApiListArticles()
  async findArticles(@Query() query: AcademicArticleQueryDto) {
    try {
      const page = await this.listArticles.execute(
        this.toArticleListInput(query),
      );
      return createSuccessResponse(page, 'Articles retrieved');
    } catch (error) {
      if (error instanceof InvalidArticleKeywordCursorError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @Get('articles/:articleId')
  @ApiGetArticle()
  async findArticle(@Param('articleId') articleId: string) {
    const article = await this.getArticleById.execute({ articleId });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return createSuccessResponse(article, 'Article retrieved');
  }

  @Get('authors')
  @ApiListAuthors()
  async findAuthors(@Query() query: AcademicCursorQueryDto) {
    const page = await this.listAuthors.execute(this.toCursorInput(query));
    return createSuccessResponse(page, 'Authors retrieved');
  }

  @Get('authors/:authorId')
  @ApiGetAuthor()
  async findAuthor(@Param('authorId') authorId: string) {
    const author = await this.getAuthorById.execute({ authorId });

    if (!author) {
      throw new NotFoundException('Author not found');
    }

    return createSuccessResponse(author, 'Author retrieved');
  }

  @Get('journals')
  @ApiListJournals()
  async findJournals(@Query() query: AcademicCursorQueryDto) {
    const page = await this.listJournals.execute(this.toCursorInput(query));
    return createSuccessResponse(page, 'Journals retrieved');
  }

  @Get('journals/:journalId')
  @ApiGetJournal()
  async findJournal(@Param('journalId') journalId: string) {
    const journal = await this.getJournalById.execute({ journalId });

    if (!journal) {
      throw new NotFoundException('Journal not found');
    }

    return createSuccessResponse(journal, 'Journal retrieved');
  }

  private toCursorInput(query: AcademicCursorQueryDto): CursorPaginationInput {
    const limitValue = query.limit ?? String(DEFAULT_LIMIT);
    const limit = Number(limitValue);

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > MAX_LIMIT ||
      limitValue.trim() === ''
    ) {
      throw new BadRequestException(
        `limit must be an integer between 1 and ${MAX_LIMIT}`,
      );
    }

    const cursor = query.cursor?.trim() || null;

    return { cursor, limit };
  }

  private toArticleListInput(query: AcademicArticleQueryDto): ArticleListInput {
    const input = this.toCursorInput(query);
    const keyword = query.keyword?.trim() || null;

    return { ...input, keyword };
  }
}
