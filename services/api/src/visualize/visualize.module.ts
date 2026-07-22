import { Module } from '@nestjs/common';
import {
  ARTICLE_GRAPH_VISUALIZATION_REPOSITORY,
  ArticleGraphVisualizationRepository,
} from '@/visualize/application/ports/article-graph-visualization.port';
import { GetArticleGraphUseCase } from '@/visualize/application/use-cases/get-article-graph/get-article-graph.use-case';
import { Neo4jArticleGraphVisualizationRepository } from '@/visualize/infrastructure/neo4j/neo4j-article-graph-visualization.repository';
import { ArticleGraphController } from '@/visualize/interfaces/http/article-graph.controller';

@Module({
  controllers: [ArticleGraphController],
  providers: [
    Neo4jArticleGraphVisualizationRepository,
    {
      provide: GetArticleGraphUseCase,
      useFactory: (repository: ArticleGraphVisualizationRepository) =>
        new GetArticleGraphUseCase(repository),
      inject: [ARTICLE_GRAPH_VISUALIZATION_REPOSITORY],
    },
    {
      provide: ARTICLE_GRAPH_VISUALIZATION_REPOSITORY,
      useExisting: Neo4jArticleGraphVisualizationRepository,
    },
  ],
})
export class VisualizeModule {}
