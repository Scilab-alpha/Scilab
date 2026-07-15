import { Injectable } from '@nestjs/common';
import { RankingMetricType, RankingSource } from '@prisma/client';
import {
  JournalRankingRepository,
  UpsertScimagoJournalRankingInput,
  UpsertScimagoTaxonomyInput,
} from '@repo/academic/application/ports/journal-ranking.port';
import { ScimagoCategory } from '@repo/academic/domain/scimago.model';
import { PrismaService } from '@repo/database';

const METRICS = {
  SJR: {
    displayName: 'SJR',
    metricType: RankingMetricType.SCORE,
    description: 'SCImago Journal Rank score.',
  },
  H_INDEX: {
    displayName: 'H-index',
    metricType: RankingMetricType.SCORE,
    description: 'SCImago H-index.',
  },
  SCIMAGO_RANK: {
    displayName: 'SCImago Rank',
    metricType: RankingMetricType.RANK,
    description: 'Overall SCImago journal rank.',
  },
  SCIMAGO_QUARTILE: {
    displayName: 'SCImago Quartile',
    metricType: RankingMetricType.QUARTILE,
    description: 'Best or subject-category SCImago quartile.',
  },
} as const;

@Injectable()
export class PrismaJournalRankingRepository implements JournalRankingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertScimagoTaxonomy(
    input: UpsertScimagoTaxonomyInput,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const [code, metric] of Object.entries(METRICS)) {
        await tx.rankingMetric.upsert({
          where: { code },
          update: metric,
          create: { code, ...metric },
        });
      }

      for (const displayName of input.subjectAreas) {
        await tx.subjectArea.upsert({
          where: { displayName },
          update: {},
          create: { displayName },
        });
      }

      const subjectAreas = await tx.subjectArea.findMany({
        where: { displayName: { in: input.subjectAreas } },
        select: { id: true, displayName: true },
      });
      const areaIds = new Map(
        subjectAreas.map((area) => [area.displayName, area.id]),
      );

      for (const category of input.subjectCategories) {
        await tx.subjectCategory.upsert({
          where: { displayName: category.displayName },
          update: {
            subjectAreaId: category.subjectAreaName
              ? (areaIds.get(category.subjectAreaName) ?? null)
              : null,
          },
          create: {
            displayName: category.displayName,
            subjectAreaId: category.subjectAreaName
              ? (areaIds.get(category.subjectAreaName) ?? null)
              : null,
          },
        });
      }
    });
  }

  async upsertScimagoJournalRanking(
    input: UpsertScimagoJournalRankingInput,
  ): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const [metrics, categories] = await Promise.all([
        tx.rankingMetric.findMany({
          where: { code: { in: Object.keys(METRICS) } },
          select: { id: true, code: true },
        }),
        tx.subjectCategory.findMany({
          where: {
            displayName: {
              in: input.record.categories.map(
                (category) => category.displayName,
              ),
            },
          },
          select: { id: true, displayName: true },
        }),
      ]);
      const metricIds = new Map(
        metrics.map((metric) => [metric.code, metric.id]),
      );
      const categoryIds = new Map(
        categories.map((category) => [category.displayName, category.id]),
      );
      const rows = [
        input.record.sjr === null
          ? null
          : {
              metricCode: 'SJR',
              scopeKey: 'GLOBAL',
              subjectCategoryId: null,
              valueText: String(input.record.sjr),
              valueInt: null,
              valueFloat: input.record.sjr,
            },
        input.record.hIndex === null
          ? null
          : {
              metricCode: 'H_INDEX',
              scopeKey: 'GLOBAL',
              subjectCategoryId: null,
              valueText: String(input.record.hIndex),
              valueInt: input.record.hIndex,
              valueFloat: null,
            },
        input.record.rank === null
          ? null
          : {
              metricCode: 'SCIMAGO_RANK',
              scopeKey: 'GLOBAL',
              subjectCategoryId: null,
              valueText: String(input.record.rank),
              valueInt: input.record.rank,
              valueFloat: null,
            },
        createQuartileRow(input.record.bestQuartile, null, 'GLOBAL'),
        ...input.record.categories.map((category) =>
          createCategoryQuartileRow(category, categoryIds),
        ),
      ].filter(isRankingRow);

      for (const row of rows) {
        const metricId = metricIds.get(row.metricCode);

        if (!metricId) {
          throw new Error(`SCImago metric ${row.metricCode} is not configured`);
        }

        await tx.journalRanking.upsert({
          where: {
            journalId_scopeKey_source_metricId_year: {
              journalId: input.journalId,
              scopeKey: row.scopeKey,
              source: RankingSource.SCIMAGO,
              metricId,
              year: input.year,
            },
          },
          update: {
            subjectCategoryId: row.subjectCategoryId,
            valueText: row.valueText,
            valueInt: row.valueInt,
            valueFloat: row.valueFloat,
          },
          create: {
            journalId: input.journalId,
            scopeKey: row.scopeKey,
            subjectCategoryId: row.subjectCategoryId,
            source: RankingSource.SCIMAGO,
            metricId,
            year: input.year,
            valueText: row.valueText,
            valueInt: row.valueInt,
            valueFloat: row.valueFloat,
          },
        });
      }

      return rows.length;
    });
  }
}

function createCategoryQuartileRow(
  category: ScimagoCategory,
  categoryIds: Map<string, string>,
) {
  const categoryId = categoryIds.get(category.displayName);

  if (!categoryId) {
    throw new Error(
      `SCImago category ${category.displayName} is not configured`,
    );
  }

  return createQuartileRow(
    category.quartile,
    categoryId,
    `CATEGORY:${categoryId}`,
  );
}

function createQuartileRow(
  quartile: string | null,
  subjectCategoryId: string | null,
  scopeKey: string,
) {
  if (!quartile) {
    return null;
  }

  return {
    metricCode: 'SCIMAGO_QUARTILE',
    scopeKey,
    subjectCategoryId,
    valueText: quartile,
    valueInt: Number(quartile.slice(1)),
    valueFloat: null,
  };
}

function isRankingRow<T>(value: T | null): value is T {
  return value !== null;
}
