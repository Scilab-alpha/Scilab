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
  InvalidJournalRankingCursorError,
  JournalRankingDatasetNotFoundError,
  ListJournalRankingsUseCase,
} from '@/academic/application/use-cases/list-journal-rankings/list-journal-rankings.use-case';
import {
  ArticleListInput,
  CursorPaginationInput,
  InvalidArticleListCursorError,
} from '@/academic/domain/academic-graph.model';
import { normalizeExactName } from '@/academic/domain/normalize-exact-name';
import {
  AcademicArticleQueryDto,
  AcademicCursorQueryDto,
  JournalRankingListQueryDto,
} from '@/academic/interfaces/http/academic.dto';
import {
  ApiGetArticle,
  ApiGetAuthor,
  ApiGetJournal,
  ApiListArticles,
  ApiListAuthors,
  ApiListJournals,
  ApiListJournalRankings,
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
    private readonly listJournalRankings: ListJournalRankingsUseCase,
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
      if (error instanceof InvalidArticleListCursorError) {
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

  @Get('journal-rankings')
  @ApiListJournalRankings()
  async findJournalRankings(@Query() query: JournalRankingListQueryDto) {
    try {
      const page = await this.listJournalRankings.execute(
        this.toJournalRankingListInput(query),
      );
      return createSuccessResponse(page, 'Journal rankings retrieved');
    } catch (error) {
      if (error instanceof InvalidJournalRankingCursorError) {
        throw new BadRequestException(error.message);
      }

      if (error instanceof JournalRankingDatasetNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
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
    const q = this.optionalText(query.q, 'q', 200);
    const keywordId = this.optionalText(query.keywordId, 'keywordId');
    const topicId = this.optionalText(query.topicId, 'topicId');
    const authorId = this.optionalText(query.authorId, 'authorId');
    const journalId = this.optionalText(query.journalId, 'journalId');
    const publisherInput = this.optionalText(query.publisher, 'publisher', 255);
    const publisher = normalizeExactName(publisherInput);
    const countryInput = this.optionalText(query.country, 'country', 2);
    const country = countryInput?.toUpperCase() ?? null;

    if (country && !/^[A-Z]{2}$/.test(country)) {
      throw new BadRequestException(
        'country must be an ISO 3166-1 alpha-2 code',
      );
    }

    const publicationYear = this.optionalYear(
      query.publicationYear,
      'publicationYear',
    );
    const publicationYearFrom = this.optionalYear(
      query.publicationYearFrom,
      'publicationYearFrom',
    );
    const publicationYearTo = this.optionalYear(
      query.publicationYearTo,
      'publicationYearTo',
    );

    if (
      publicationYear !== null &&
      (publicationYearFrom !== null || publicationYearTo !== null)
    ) {
      throw new BadRequestException(
        'publicationYear cannot be combined with publicationYearFrom or publicationYearTo',
      );
    }

    if (
      publicationYearFrom !== null &&
      publicationYearTo !== null &&
      publicationYearFrom > publicationYearTo
    ) {
      throw new BadRequestException(
        'publicationYearFrom must be less than or equal to publicationYearTo',
      );
    }

    const hasResearchQuery = Boolean(q || keywordId || topicId);
    const sort =
      query.sort?.trim() || (hasResearchQuery ? 'relevant' : 'newest');

    if (!['relevant', 'newest', 'most_cited'].includes(sort)) {
      throw new BadRequestException(
        'sort must be one of relevant, newest, or most_cited',
      );
    }

    if (sort === 'relevant' && !hasResearchQuery) {
      throw new BadRequestException(
        'relevant sort requires q, keywordId, or topicId',
      );
    }

    return {
      ...input,
      q,
      keywordId,
      topicId,
      authorId,
      journalId,
      publicationYear,
      publicationYearFrom,
      publicationYearTo,
      publisher,
      country,
      sort: sort as ArticleListInput['sort'],
    };
  }

  private toJournalRankingListInput(query: JournalRankingListQueryDto): {
    year: number;
    cursor: string | null;
    limit: number;
  } {
    if (query.year === undefined) {
      throw new BadRequestException('year is required');
    }

    const year = this.optionalYear(query.year, 'year');

    if (year === null) {
      throw new BadRequestException('year is required');
    }

    const { cursor, limit } = this.toCursorInput(query);

    return { year, cursor: cursor ?? null, limit };
  }

  private optionalText(
    value: string | undefined,
    field: string,
    maximumLength = 255,
  ): string | null {
    const normalized = value?.trim() || null;

    if (normalized && normalized.length > maximumLength) {
      throw new BadRequestException(
        `${field} must not exceed ${maximumLength} characters`,
      );
    }

    return normalized;
  }

  private optionalYear(
    value: string | undefined,
    field: string,
  ): number | null {
    if (value === undefined) {
      return null;
    }

    const year = Number(value);
    const maximumYear = new Date().getUTCFullYear() + 1;

    if (
      value.trim() === '' ||
      !Number.isInteger(year) ||
      year < 1000 ||
      year > maximumYear
    ) {
      throw new BadRequestException(
        `${field} must be an integer between 1000 and ${maximumYear}`,
      );
    }

    return year;
  }
}
