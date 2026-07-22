/* Swagger exposes operations through dynamic OpenAPI maps in this contract test. */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { AdminAcademicService } from '@/admin/application/admin-academic.service';
import { ValidateAccessTokenUseCase } from '@/auth/application/use-cases/validate-access-token/validate-access-token.use-case';
import { JwtAuthGuard } from '@/auth/interfaces/guards/jwt-auth.guard';
import { AdminGuard } from '@/user/interfaces/guards/admin.guard';
import { AdminAcademicController } from './admin-academic.controller';

describe('Admin academic OpenAPI contract', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AdminAcademicController],
      providers: [
        { provide: AdminAcademicService, useValue: {} },
        JwtAuthGuard,
        AdminGuard,
        {
          provide: ValidateAccessTokenUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('documents all admin endpoints with bearer auth and standard responses', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Scilab API').addBearerAuth().build(),
    );
    const expected = [
      '/admin/dashboard',
      '/admin/sync-logs',
      '/admin/sync-logs/{id}',
      '/admin/jobs',
      '/admin/jobs/{id}',
      '/admin/jobs/{id}/pause',
      '/admin/jobs/{id}/resume',
      '/admin/jobs/{id}/trigger',
      '/admin/jobs/{id}/cancel',
      '/admin/jobs/{id}/retry',
      '/admin/journals',
      '/admin/journals/{id}',
      '/admin/articles',
      '/admin/articles/{id}',
    ];

    expect(expected.every((path) => path in document.paths)).toBe(true);

    for (const path of expected) {
      const operation = Object.values(document.paths[path] ?? {})[0];
      expect(operation?.security).toBeDefined();
      expect(operation?.responses?.['400']).toBeDefined();
      expect(operation?.responses?.['401']).toBeDefined();
      expect(operation?.responses?.['403']).toBeDefined();
      expect(operation?.responses?.['404']).toBeDefined();
      expect(operation?.responses?.['409']).toBeDefined();
      expect(operation?.responses?.['503']).toBeDefined();
      expect(operation?.responses?.['500']).toBeDefined();
      expect(JSON.stringify(operation)).toContain('success');
      expect(JSON.stringify(operation)).toContain('message');
      expect(JSON.stringify(operation)).toContain('data');
    }

    expect(
      document.paths['/admin/jobs/{id}/pause']?.post?.responses?.['200'],
    ).toBeDefined();
    expect(
      document.paths['/admin/jobs/{id}/resume']?.post?.responses?.['200'],
    ).toBeDefined();
    expect(
      document.paths['/admin/jobs/{id}/trigger']?.post?.responses?.['202'],
    ).toBeDefined();
    expect(
      document.paths['/admin/jobs/{id}/cancel']?.post?.responses?.['202'],
    ).toBeDefined();
    expect(
      document.paths['/admin/jobs/{id}/retry']?.post?.responses?.['202'],
    ).toBeDefined();
    expect(JSON.stringify(document.paths['/admin/dashboard']?.get)).toContain(
      'articleCount',
    );
    expect(JSON.stringify(document.paths['/admin/dashboard']?.get)).toContain(
      'generatedAt',
    );
    expect(JSON.stringify(document.paths['/admin/dashboard']?.get)).toContain(
      'dataQuality',
    );
    expect(JSON.stringify(document.paths['/admin/dashboard']?.get)).toContain(
      'unreadNotificationCount',
    );
    expect(
      JSON.stringify(
        document.paths['/admin/dashboard']?.get?.responses?.['503'],
      ),
    ).toContain('success');

    for (const path of [
      '/admin/jobs/{id}',
      '/admin/jobs/{id}/pause',
      '/admin/jobs/{id}/resume',
      '/admin/jobs/{id}/trigger',
      '/admin/jobs/{id}/cancel',
      '/admin/jobs/{id}/retry',
    ]) {
      const operation = document.paths[path]?.get ?? document.paths[path]?.post;
      const parameter = (operation?.parameters ?? []).find(
        (item) => 'name' in item && item.name === 'id',
      );
      expect(JSON.stringify(parameter)).toContain('journal-article-sync');
    }

    const syncLogParameters = (
      document.paths['/admin/sync-logs']?.get?.parameters ?? []
    )
      .map((parameter) => ('name' in parameter ? parameter.name : null))
      .filter((name): name is string => name !== null);
    expect(syncLogParameters).toEqual(
      expect.arrayContaining([
        'page',
        'pageSize',
        'source',
        'dataType',
        'status',
        'startedFrom',
        'startedTo',
      ]),
    );
  });
});
