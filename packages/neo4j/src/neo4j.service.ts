import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import neo4j, {
  type Driver,
  type ManagedTransaction,
  type Record as Neo4jRecord,
  type ResultSummary,
} from 'neo4j-driver';
import {
  isNeo4jConfigured,
  loadNeo4jConfig,
  type Neo4jConfig,
} from './neo4j.config';

export type CypherParameters = Record<string, unknown>;
export type CypherRow = Record<string, unknown>;
export type CypherRecordMapper<Row> = (record: Neo4jRecord) => Row;

export interface CypherResult<Row = CypherRow> {
  records: Row[];
  summary: ResultSummary;
}

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private readonly config: Neo4jConfig = loadNeo4jConfig();
  private driver?: Driver;

  async onModuleInit() {
    if (isNeo4jConfigured(this.config)) {
      await this.getDriver().verifyConnectivity({
        database: this.config.database,
      });
    }
  }

  async onModuleDestroy() {
    if (this.driver) {
      await this.driver.close();
    }
  }

  async executeRead<Row = CypherRow>(
    cypher: string,
    parameters: CypherParameters = {},
    mapRecord?: CypherRecordMapper<Row>,
  ): Promise<CypherResult<Row>> {
    const session = this.getDriver().session({
      database: this.config.database,
    });

    try {
      return await session.executeRead((tx) =>
        this.runQuery(tx, cypher, parameters, mapRecord),
      );
    } finally {
      await session.close();
    }
  }

  async executeWrite<Row = CypherRow>(
    cypher: string,
    parameters: CypherParameters = {},
    mapRecord?: CypherRecordMapper<Row>,
  ): Promise<CypherResult<Row>> {
    const session = this.getDriver().session({
      database: this.config.database,
    });

    try {
      return await session.executeWrite((tx) =>
        this.runQuery(tx, cypher, parameters, mapRecord),
      );
    } finally {
      await session.close();
    }
  }

  async verifyConnectivity(): Promise<void> {
    await this.getDriver().verifyConnectivity({
      database: this.config.database,
    });
  }

  isConfigured(): boolean {
    return isNeo4jConfigured(this.config);
  }

  private getDriver(): Driver {
    const { uri, username, password } = this.config;

    if (!uri || !username || !password) {
      throw new Error(
        'Neo4j is not configured. Set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD.',
      );
    }

    if (!this.driver) {
      this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
        maxConnectionPoolSize: this.config.maxConnectionPoolSize,
        connectionAcquisitionTimeout: this.config.connectionAcquisitionTimeout,
        connectionTimeout: this.config.connectionTimeout,
        maxTransactionRetryTime: this.config.maxTransactionRetryTime,
      });
    }

    return this.driver;
  }

  private async runQuery<Row>(
    tx: ManagedTransaction,
    cypher: string,
    parameters: CypherParameters,
    mapRecord?: CypherRecordMapper<Row>,
  ): Promise<CypherResult<Row>> {
    const result = await tx.run(cypher, parameters);
    const records = result.records.map((record) =>
      mapRecord ? mapRecord(record) : (record.toObject() as Row),
    );

    return {
      records,
      summary: result.summary,
    };
  }
}
