import { INestApplication, Module } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { BootstrapAdminUseCase } from '../src/auth/application/use-cases/bootstrap-admin/bootstrap-admin.use-case';
import { Neo4jModule } from '../src/neo4j/neo4j.module';
import { Neo4jService } from '../src/neo4j/neo4j.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from './../src/app.module';

@Module({
  providers: [{ provide: PrismaService, useValue: {} }],
  exports: [PrismaService],
})
class PrismaTestingModule {}

@Module({
  providers: [{ provide: Neo4jService, useValue: {} }],
  exports: [Neo4jService],
})
class Neo4jTestingModule {}

describe('AppModule (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(PrismaModule)
      .useModule(PrismaTestingModule)
      .overrideModule(Neo4jModule)
      .useModule(Neo4jTestingModule)
      .overrideProvider(BootstrapAdminUseCase)
      .useValue({ execute: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('does not expose GET /', () => {
    return request(app.getHttpServer()).get('/').expect(404);
  });

  it('does not include GET / in the OpenAPI document', () => {
    const swaggerDocument = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Scilab API').addBearerAuth().build(),
    );

    expect(swaggerDocument.paths).not.toHaveProperty('/');
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });
});
