import { Module } from '@nestjs/common';
import { AcademicModule } from '@/academic/academic.module';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { AuthModule } from '@/auth/auth.module';
import { Neo4jModule } from '@/neo4j/neo4j.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [PrismaModule, Neo4jModule, AcademicModule, AuthModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
