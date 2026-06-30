import { Injectable, OnModuleInit } from '@nestjs/common';
import { Neo4jService } from '@/neo4j/neo4j.service';
import { Neo4jAcademicGraphRepository } from './neo4j-academic-graph.repository';

@Injectable()
export class AcademicGraphSchemaInitializer implements OnModuleInit {
  constructor(
    private readonly neo4j: Neo4jService,
    private readonly repository: Neo4jAcademicGraphRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.neo4j.isConfigured()) {
      return;
    }

    await this.repository.ensureSchema();
  }
}
