import { Module } from '@nestjs/common';
import { AcademicModule } from '@/academic/academic.module';
import { AuthModule } from '@/auth/auth.module';
import { Neo4jModule } from '@/neo4j/neo4j.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { UserModule } from '@/user/user.module';

@Module({
  imports: [PrismaModule, Neo4jModule, AcademicModule, AuthModule, UserModule],
})
export class AppModule {}
