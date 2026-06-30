import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { Neo4jModule } from '@/neo4j/neo4j.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { UserModule } from '@/user/user.module';

@Module({
  imports: [PrismaModule, Neo4jModule, AuthModule, UserModule],
})
export class AppModule {}
