import 'dotenv/config';

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import neo4j, {
  AuthToken,
  Driver,
  QueryResult,
  RecordShape,
  Session,
  SessionMode,
} from 'neo4j-driver';

type Neo4jConfig = {
  uri: string;
  username: string;
  password: string;
  database?: string;
  maxConnectionPoolSize?: number;
  connectionAcquisitionTimeout?: number;
  connectionTimeout?: number;
  maxTransactionRetryTime?: number;
};

type SessionOptions = {
  database?: string;
  defaultAccessMode?: SessionMode;
};

function parseOptionalNumber(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid Neo4j numeric configuration value: ${value}`);
  }

  return parsed;
}

function readNeo4jConfig(): Neo4jConfig {
  const uri = process.env.NEO4J_URI;
  const username = process.env.NEO4J_USERNAME;
  const password = process.env.NEO4J_PASSWORD;

  if (!uri) {
    throw new Error('NEO4J_URI is not set');
  }

  if (!username) {
    throw new Error('NEO4J_USERNAME is not set');
  }

  if (!password) {
    throw new Error('NEO4J_PASSWORD is not set');
  }

  return {
    uri,
    username,
    password,
    database: process.env.NEO4J_DATABASE,
    maxConnectionPoolSize: parseOptionalNumber(
      process.env.NEO4J_MAX_CONNECTION_POOL_SIZE,
    ),
    connectionAcquisitionTimeout: parseOptionalNumber(
      process.env.NEO4J_CONNECTION_ACQUISITION_TIMEOUT,
    ),
    connectionTimeout: parseOptionalNumber(
      process.env.NEO4J_CONNECTION_TIMEOUT,
    ),
    maxTransactionRetryTime: parseOptionalNumber(
      process.env.NEO4J_MAX_TRANSACTION_RETRY_TIME,
    ),
  };
}

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private readonly config = readNeo4jConfig();
  private readonly auth: AuthToken = neo4j.auth.basic(
    this.config.username,
    this.config.password,
  );
  private readonly driver: Driver = neo4j.driver(this.config.uri, this.auth, {
    maxConnectionPoolSize: this.config.maxConnectionPoolSize,
    connectionAcquisitionTimeout: this.config.connectionAcquisitionTimeout,
    connectionTimeout: this.config.connectionTimeout,
    maxTransactionRetryTime: this.config.maxTransactionRetryTime,
  });

  async onModuleInit() {
    await this.driver.verifyConnectivity();
  }

  async onModuleDestroy() {
    await this.driver.close();
  }

  getDriver() {
    return this.driver;
  }

  getDatabase() {
    return this.config.database;
  }

  getSession(options: SessionOptions = {}): Session {
    return this.driver.session({
      database: options.database ?? this.config.database,
      defaultAccessMode: options.defaultAccessMode,
    });
  }

  async executeRead<T extends RecordShape = RecordShape>(
    cypher: string,
    parameters: Record<string, unknown> = {},
    options: Omit<SessionOptions, 'defaultAccessMode'> = {},
  ): Promise<QueryResult<T>> {
    const session = this.getSession({
      ...options,
      defaultAccessMode: neo4j.session.READ,
    });

    try {
      return await session.executeRead((tx) => tx.run<T>(cypher, parameters));
    } finally {
      await session.close();
    }
  }

  async executeWrite<T extends RecordShape = RecordShape>(
    cypher: string,
    parameters: Record<string, unknown> = {},
    options: Omit<SessionOptions, 'defaultAccessMode'> = {},
  ): Promise<QueryResult<T>> {
    const session = this.getSession({
      ...options,
      defaultAccessMode: neo4j.session.WRITE,
    });

    try {
      return await session.executeWrite((tx) => tx.run<T>(cypher, parameters));
    } finally {
      await session.close();
    }
  }
}
