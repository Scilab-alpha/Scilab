import { Module } from '@nestjs/common';
import { ACADEMIC_GRAPH_REPOSITORY } from '@/academic/application/ports/academic-graph.port';
import { AcademicGraphSchemaInitializer } from '@/academic/infrastructure/neo4j/academic-graph-schema.initializer';
import { Neo4jAcademicGraphRepository } from '@/academic/infrastructure/neo4j/neo4j-academic-graph.repository';
import { Neo4jModule } from '@/neo4j/neo4j.module';

@Module({
  imports: [Neo4jModule],
  providers: [
    Neo4jAcademicGraphRepository,
    AcademicGraphSchemaInitializer,
    {
      provide: ACADEMIC_GRAPH_REPOSITORY,
      useExisting: Neo4jAcademicGraphRepository,
    },
  ],
  exports: [ACADEMIC_GRAPH_REPOSITORY],
})
export class AcademicModule {}
