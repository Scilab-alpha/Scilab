/* Swagger exposes operations through dynamic OpenAPI maps in this contract test. */
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { ValidateAccessTokenUseCase } from '@/auth/application/use-cases/validate-access-token/validate-access-token.use-case';
import { JwtAuthGuard } from '@/auth/interfaces/guards/jwt-auth.guard';
import { GetDashboardUseCase } from '@/dashboard/application/use-cases/get-dashboard/get-dashboard.use-case';
import { DashboardController } from './dashboard.controller';

describe('Dashboard OpenAPI contract', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: GetDashboardUseCase, useValue: {} },
        JwtAuthGuard,
        {
          provide: ValidateAccessTokenUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => app?.close());

  it('documents bearer authentication, the expanded response, and failure envelopes', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Scilab API').addBearerAuth().build(),
    );
    const operation = document.paths['/dashboard/me']?.get;

    expect(operation?.security).toBeDefined();
    expect(operation?.responses?.['200']).toBeDefined();
    expect(operation?.responses?.['401']).toBeDefined();
    expect(operation?.responses?.['500']).toBeDefined();
    expect(operation?.responses?.['503']).toBeDefined();
    expect(JSON.stringify(operation)).toContain('ranking');
    expect(JSON.stringify(operation)).toContain('topJournals');
    expect(JSON.stringify(operation)).toContain('recentPublications');
    expect(JSON.stringify(operation?.responses?.['503'])).toContain('success');
  });
});
