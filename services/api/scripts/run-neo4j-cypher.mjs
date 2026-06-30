import 'dotenv/config';

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import neo4j from 'neo4j-driver';

function requiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set`);
  }

  return value;
}

function splitCypherStatements(source) {
  const statements = [];
  let current = '';
  let quote = null;
  let isLineComment = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (isLineComment) {
      if (char === '\n') {
        isLineComment = false;
      }
      current += char;
      continue;
    }

    if (!quote && char === '/' && next === '/') {
      isLineComment = true;
      current += char;
      continue;
    }

    if ((char === "'" || char === '"') && source[index - 1] !== '\\') {
      quote = quote === char ? null : quote ?? char;
    }

    if (!quote && char === ';') {
      const statement = current.trim();

      if (statement) {
        statements.push(statement);
      }

      current = '';
      continue;
    }

    current += char;
  }

  const tail = current.trim();

  if (tail) {
    statements.push(tail);
  }

  return statements;
}

const cypherFile = process.argv[2];

if (!cypherFile) {
  throw new Error('Usage: node scripts/run-neo4j-cypher.mjs <file.cypher>');
}

const uri = requiredEnv('NEO4J_URI');
const username = requiredEnv('NEO4J_USERNAME');
const password = requiredEnv('NEO4J_PASSWORD');
const database = process.env.NEO4J_DATABASE;

const source = await readFile(resolve(cypherFile), 'utf8');
const statements = splitCypherStatements(source);
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
