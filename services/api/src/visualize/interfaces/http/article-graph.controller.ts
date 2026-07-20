import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetArticleGraphUseCase } from '@/visualize/application/use-cases/get-article-graph/get-article-graph.use-case';
import {
  ArticleGraphNotFoundError,
  InvalidArticleGraphCursorError,
} from '@/visualize/domain/article-graph-visualization.model';
import { ArticleGraphQueryDto } from '@/visualize/interfaces/http/article-graph.dto';
import { ApiGetArticleGraph } from '@/visualize/interfaces/http/article-graph.swagger';
import { createSuccessResponse } from '@/shared/response/response.factory';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@ApiTags('Academic Graph')
@Controller('academic/graphs')
export class ArticleGraphController {
  constructor(private readonly getArticleGraph: GetArticleGraphUseCase) {}

  @Get('article/:id')
  @ApiGetArticleGraph()
  async get(@Param('id') id: string, @Query() query: ArticleGraphQueryDto) {
    try {
      const graph = await this.getArticleGraph.execute({
        articleId: id,
        cursor: query.cursor?.trim() || null,
        limit: this.toLimit(query.limit),
      });

      return createSuccessResponse(graph, 'Article graph retrieved');
    } catch (error) {
      if (error instanceof InvalidArticleGraphCursorError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof ArticleGraphNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }

  private toLimit(value?: string): number {
    const limitValue = value ?? String(DEFAULT_LIMIT);
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

    return limit;
  }
}
