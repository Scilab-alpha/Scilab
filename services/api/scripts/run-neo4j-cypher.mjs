import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import neo4j from 'neo4j-driver';

const envFile = resolve('.env');

if (existsSync(envFile)) {
  loadEnvFile(envFile);
}

function requiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set`);
  }

  return value;
}

const uri = requiredEnv('NEO4J_URI');
const username = requiredEnv('NEO4J_USERNAME');
const password = requiredEnv('NEO4J_PASSWORD');
const database = process.env.NEO4J_DATABASE;

const schemaModule = await import(
  '../dist/academic/infrastructure/neo4j/academic-graph-schema.cypher.js'
);
const statements =
  schemaModule.ACADEMIC_GRAPH_SCHEMA_CYPHER ??
  schemaModule.default?.ACADEMIC_GRAPH_SCHEMA_CYPHER;

if (!Array.isArray(statements)) {
  throw new Error('Compiled academic graph schema could not be loaded');
}
const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
const session = driver.session({ database });

try {
  for (const [index, statement] of statements.entries()) {
    await session.run(statement);
    console.info(`Executed Cypher statement ${index + 1}/${statements.length}`);
  }
} finally {
  await session.close();
  await driver.close();
}
