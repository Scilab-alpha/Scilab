import 'dotenv/config';

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const DEFAULT_DATABASE_SCHEMA = 'public';

function resolveDatabaseConfig(connectionString: string) {
  const url = new URL(connectionString);
  const schema = url.searchParams.get('schema') ?? DEFAULT_DATABASE_SCHEMA;

  url.searchParams.delete('schema');

  return {
    connectionString: url.toString(),
    schema,
  };
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }

    const database = resolveDatabaseConfig(connectionString);

    super({
      adapter: new PrismaPg(
        { connectionString: database.connectionString },
        { schema: database.schema },
      ),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
