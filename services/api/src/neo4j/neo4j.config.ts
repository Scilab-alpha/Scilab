import 'dotenv/config';

export interface Neo4jConfig {
  uri?: string;
  username?: string;
  password?: string;
  database?: string;
  maxConnectionPoolSize: number;
  connectionAcquisitionTimeout: number;
  connectionTimeout: number;
  maxTransactionRetryTime: number;
}

const DEFAULT_MAX_CONNECTION_POOL_SIZE = 50;
const DEFAULT_CONNECTION_ACQUISITION_TIMEOUT = 60_000;
const DEFAULT_CONNECTION_TIMEOUT = 30_000;
const DEFAULT_MAX_TRANSACTION_RETRY_TIME = 30_000;

export function loadNeo4jConfig(): Neo4jConfig {
  return {
    uri: process.env.NEO4J_URI,
    username: process.env.NEO4J_USERNAME,
    password: process.env.NEO4J_PASSWORD,
    database: process.env.NEO4J_DATABASE,
    maxConnectionPoolSize: readNumber(
      'NEO4J_MAX_CONNECTION_POOL_SIZE',
      DEFAULT_MAX_CONNECTION_POOL_SIZE,
    ),
    connectionAcquisitionTimeout: readNumber(
      'NEO4J_CONNECTION_ACQUISITION_TIMEOUT',
      DEFAULT_CONNECTION_ACQUISITION_TIMEOUT,
    ),
    connectionTimeout: readNumber(
      'NEO4J_CONNECTION_TIMEOUT',
      DEFAULT_CONNECTION_TIMEOUT,
    ),
    maxTransactionRetryTime: readNumber(
      'NEO4J_MAX_TRANSACTION_RETRY_TIME',
      DEFAULT_MAX_TRANSACTION_RETRY_TIME,
    ),
  };
}

export function isNeo4jConfigured(config: Neo4jConfig): boolean {
  return Boolean(config.uri && config.username && config.password);
}

function readNumber(name: string, fallback: number): number {
  const rawValue = process.env[name];

  if (!rawValue) {
    return fallback;
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number`);
  }

  return value;
}
