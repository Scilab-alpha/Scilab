import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'argon2';
import {
  AuthProvider,
  PrismaClient,
  RankingMetricType,
  RankingSource,
  RoleAccount,
  StatusAccount,
  ZoneSource,
  ZoneType,
} from '@prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const ids = {
  users: {
    admin: '11111111-1111-4111-8111-111111111111',
    researcher: '11111111-1111-4111-8111-111111111112',
    reviewer: '11111111-1111-4111-8111-111111111113',
  },
  publishers: {
    springer: '22222222-2222-4222-8222-222222222221',
    elsevier: '22222222-2222-4222-8222-222222222222',
    ieee: '22222222-2222-4222-8222-222222222223',
  },
  zones: {
    vietnam: '33333333-3333-4333-8333-333333333331',
    usa: '33333333-3333-4333-8333-333333333332',
    uk: '33333333-3333-4333-8333-333333333333',
    asiaPacific: '33333333-3333-4333-8333-333333333334',
    northAmerica: '33333333-3333-4333-8333-333333333335',
    europe: '33333333-3333-4333-8333-333333333336',
  },
  subjectAreas: {
    computerScience: '44444444-4444-4444-8444-444444444441',
    medicine: '44444444-4444-4444-8444-444444444442',
    environmentalScience: '44444444-4444-4444-8444-444444444443',
  },
  subjectCategories: {
    ai: '55555555-5555-4555-8555-555555555551',
    software: '55555555-5555-4555-8555-555555555552',
    publicHealth: '55555555-5555-4555-8555-555555555553',
    sustainability: '55555555-5555-4555-8555-555555555554',
  },
  metrics: {
    quartile: '66666666-6666-4666-8666-666666666661',
    rank: '66666666-6666-4666-8666-666666666662',
    sjr: '66666666-6666-4666-8666-666666666663',
    citeScore: '66666666-6666-4666-8666-666666666664',
  },
  journals: {
    aiReview: '77777777-7777-4777-8777-777777777771',
    softwareSystems: '77777777-7777-4777-8777-777777777772',
    digitalHealth: '77777777-7777-4777-8777-777777777773',
    climateData: '77777777-7777-4777-8777-777777777774',
  },
  volumes: {
    ai2025: '88888888-8888-4888-8888-888888888881',
    software2025: '88888888-8888-4888-8888-888888888882',
    health2024: '88888888-8888-4888-8888-888888888883',
    climate2024: '88888888-8888-4888-8888-888888888884',
  },
  issues: {
    ai2025Issue1: '99999999-9999-4999-8999-999999999991',
    software2025Issue2: '99999999-9999-4999-8999-999999999992',
    health2024Issue1: '99999999-9999-4999-8999-999999999993',
    climate2024Issue3: '99999999-9999-4999-8999-999999999994',
  },
  topics: {
    neuralRetrieval: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    reproducibility: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    digitalEpidemiology: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    climateModeling: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
    dataGovernance: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
  },
  articles: {
    retrievalBenchmarks: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    testAutomation: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    mobileHealth: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
    regionalClimate: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4',
  },
  authors: {
    anNguyen: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
    linhTran: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
    mayaChen: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
    davidSmith: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc4',
  },
  keywords: {
    machineLearning: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
    openScience: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2',
    healthInformatics: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd3',
    climateRisk: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd4',
    softwareQuality: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd5',
  },
  rankings: {
    aiQuartile: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
    aiSjr: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
    softwareQuartile: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3',
    healthCiteScore: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee4',
    climateRank: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee5',
  },
  issns: {
    aiPrint: 'ffffffff-ffff-4fff-8fff-fffffffffff1',
    aiOnline: 'ffffffff-ffff-4fff-8fff-fffffffffff2',
    softwarePrint: 'ffffffff-ffff-4fff-8fff-fffffffffff3',
    healthOnline: 'ffffffff-ffff-4fff-8fff-fffffffffff4',
    climatePrint: 'ffffffff-ffff-4fff-8fff-fffffffffff5',
  },
};

async function seedUsers() {
  const passwordHash = await hash('Password123!');

  await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@scilab.local' },
      update: {
        password: passwordHash,
        firstName: 'SciLab',
        lastName: 'Admin',
        status: StatusAccount.ACTIVE,
        role: RoleAccount.ADMIN,
      },
      create: {
        id: ids.users.admin,
        email: 'admin@scilab.local',
        password: passwordHash,
        type: AuthProvider.EMAIL,
        status: StatusAccount.ACTIVE,
        role: RoleAccount.ADMIN,
        firstName: 'SciLab',
        lastName: 'Admin',
        dateOfBirth: new Date('1994-04-12'),
        gender: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'researcher@scilab.local' },
      update: {
        password: passwordHash,
        firstName: 'An',
        lastName: 'Nguyen',
        status: StatusAccount.ACTIVE,
        role: RoleAccount.USER,
      },
      create: {
        id: ids.users.researcher,
        email: 'researcher@scilab.local',
        password: passwordHash,
        type: AuthProvider.EMAIL,
        status: StatusAccount.ACTIVE,
        role: RoleAccount.USER,
        firstName: 'An',
        lastName: 'Nguyen',
        dateOfBirth: new Date('1998-09-21'),
        gender: false,
      },
    }),
    prisma.user.upsert({
      where: { email: 'reviewer@scilab.local' },
      update: {
        password: passwordHash,
        firstName: 'Maya',
        lastName: 'Chen',
        status: StatusAccount.ACTIVE,
        role: RoleAccount.USER,
      },
      create: {
        id: ids.users.reviewer,
        email: 'reviewer@scilab.local',
        password: passwordHash,
        type: AuthProvider.GOOGLE,
        status: StatusAccount.ACTIVE,
        role: RoleAccount.USER,
        firstName: 'Maya',
        lastName: 'Chen',
        imageUrl:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        dateOfBirth: new Date('1991-01-05'),
        gender: false,
      },
    }),
  ]);
}

async function seedPublishersAndZones() {
  await Promise.all([
    prisma.publisher.upsert({
      where: { id: ids.publishers.springer },
      update: {
        displayName: 'Springer Nature',
        imageUrl: 'https://www.springernature.com/favicon.ico',
      },
      create: {
        id: ids.publishers.springer,
        displayName: 'Springer Nature',
        imageUrl: 'https://www.springernature.com/favicon.ico',
      },
    }),
    prisma.publisher.upsert({
      where: { id: ids.publishers.elsevier },
      update: {
        displayName: 'Elsevier',
        imageUrl: 'https://www.elsevier.com/favicon.ico',
      },
      create: {
        id: ids.publishers.elsevier,
        displayName: 'Elsevier',
        imageUrl: 'https://www.elsevier.com/favicon.ico',
      },
    }),
    prisma.publisher.upsert({
      where: { id: ids.publishers.ieee },
      update: {
        displayName: 'IEEE',
        imageUrl: 'https://www.ieee.org/favicon.ico',
      },
      create: {
        id: ids.publishers.ieee,
        displayName: 'IEEE',
        imageUrl: 'https://www.ieee.org/favicon.ico',
      },
    }),
  ]);

  await Promise.all([
    prisma.zone.upsert({
      where: {
        code_type_source: {
          code: 'VN',
          type: ZoneType.COUNTRY,
          source: ZoneSource.ISO,
        },
      },
      update: { name: 'Vietnam', isoCode: 'VN' },
      create: {
        id: ids.zones.vietnam,
        code: 'VN',
        name: 'Vietnam',
        type: ZoneType.COUNTRY,
        isoCode: 'VN',
        source: ZoneSource.ISO,
      },
    }),
    prisma.zone.upsert({
      where: {
        code_type_source: {
          code: 'US',
          type: ZoneType.COUNTRY,
          source: ZoneSource.ISO,
        },
      },
      update: { name: 'United States', isoCode: 'US' },
      create: {
        id: ids.zones.usa,
        code: 'US',
        name: 'United States',
        type: ZoneType.COUNTRY,
        isoCode: 'US',
        source: ZoneSource.ISO,
      },
    }),
    prisma.zone.upsert({
      where: {
        code_type_source: {
          code: 'GB',
          type: ZoneType.COUNTRY,
          source: ZoneSource.ISO,
        },
      },
      update: { name: 'United Kingdom', isoCode: 'GB' },
      create: {
        id: ids.zones.uk,
        code: 'GB',
        name: 'United Kingdom',
        type: ZoneType.COUNTRY,
        isoCode: 'GB',
        source: ZoneSource.ISO,
      },
    }),
    prisma.zone.upsert({
      where: {
        code_type_source: {
          code: 'APAC',
          type: ZoneType.REGION,
          source: ZoneSource.OTHER,
        },
      },
      update: { name: 'Asia Pacific' },
      create: {
        id: ids.zones.asiaPacific,
        code: 'APAC',
        name: 'Asia Pacific',
        type: ZoneType.REGION,
        source: ZoneSource.OTHER,
      },
    }),
    prisma.zone.upsert({
      where: {
        code_type_source: {
          code: 'NA',
          type: ZoneType.REGION,
          source: ZoneSource.OTHER,
        },
      },
      update: { name: 'North America' },
      create: {
        id: ids.zones.northAmerica,
        code: 'NA',
        name: 'North America',
        type: ZoneType.REGION,
        source: ZoneSource.OTHER,
      },
    }),
    prisma.zone.upsert({
      where: {
        code_type_source: {
          code: 'EU',
          type: ZoneType.REGION,
          source: ZoneSource.OTHER,
        },
      },
      update: { name: 'Europe' },
      create: {
        id: ids.zones.europe,
        code: 'EU',
        name: 'Europe',
        type: ZoneType.REGION,
        source: ZoneSource.OTHER,
      },
    }),
  ]);
}

async function seedSubjectsAndMetrics() {
  await Promise.all([
    prisma.subjectArea.upsert({
      where: { id: ids.subjectAreas.computerScience },
      update: {
        displayName: 'Computer Science',
        description: 'Computing, information systems, and software research.',
      },
      create: {
        id: ids.subjectAreas.computerScience,
        displayName: 'Computer Science',
        description: 'Computing, information systems, and software research.',
      },
    }),
    prisma.subjectArea.upsert({
      where: { id: ids.subjectAreas.medicine },
      update: {
        displayName: 'Medicine',
        description: 'Clinical, public health, and biomedical research.',
      },
      create: {
        id: ids.subjectAreas.medicine,
        displayName: 'Medicine',
        description: 'Clinical, public health, and biomedical research.',
      },
    }),
    prisma.subjectArea.upsert({
      where: { id: ids.subjectAreas.environmentalScience },
      update: {
        displayName: 'Environmental Science',
        description: 'Climate, ecology, and sustainability research.',
      },
      create: {
        id: ids.subjectAreas.environmentalScience,
        displayName: 'Environmental Science',
        description: 'Climate, ecology, and sustainability research.',
      },
    }),
  ]);

  await Promise.all([
    prisma.subjectCategory.upsert({
      where: { id: ids.subjectCategories.ai },
      update: {
        subjectAreaId: ids.subjectAreas.computerScience,
        displayName: 'Artificial Intelligence',
        description: 'Machine learning, reasoning, and intelligent systems.',
      },
      create: {
        id: ids.subjectCategories.ai,
        subjectAreaId: ids.subjectAreas.computerScience,
        displayName: 'Artificial Intelligence',
        description: 'Machine learning, reasoning, and intelligent systems.',
      },
    }),
    prisma.subjectCategory.upsert({
      where: { id: ids.subjectCategories.software },
      update: {
        subjectAreaId: ids.subjectAreas.computerScience,
        displayName: 'Software Engineering',
        description: 'Software process, quality, testing, and maintainability.',
      },
      create: {
        id: ids.subjectCategories.software,
        subjectAreaId: ids.subjectAreas.computerScience,
        displayName: 'Software Engineering',
        description: 'Software process, quality, testing, and maintainability.',
      },
    }),
    prisma.subjectCategory.upsert({
      where: { id: ids.subjectCategories.publicHealth },
      update: {
        subjectAreaId: ids.subjectAreas.medicine,
        displayName: 'Public Health',
        description: 'Population health and health informatics.',
      },
      create: {
        id: ids.subjectCategories.publicHealth,
        subjectAreaId: ids.subjectAreas.medicine,
        displayName: 'Public Health',
        description: 'Population health and health informatics.',
      },
    }),
    prisma.subjectCategory.upsert({
      where: { id: ids.subjectCategories.sustainability },
      update: {
        subjectAreaId: ids.subjectAreas.environmentalScience,
        displayName: 'Sustainability',
        description: 'Sustainable systems and climate adaptation.',
      },
      create: {
        id: ids.subjectCategories.sustainability,
        subjectAreaId: ids.subjectAreas.environmentalScience,
        displayName: 'Sustainability',
        description: 'Sustainable systems and climate adaptation.',
      },
    }),
  ]);

  await Promise.all([
    prisma.rankingMetric.upsert({
      where: { code: 'SCIMAGO_QUARTILE' },
      update: {
        displayName: 'SCImago Quartile',
        metricType: RankingMetricType.QUARTILE,
      },
      create: {
        id: ids.metrics.quartile,
        code: 'SCIMAGO_QUARTILE',
        displayName: 'SCImago Quartile',
        metricType: RankingMetricType.QUARTILE,
        description: 'Quartile ranking by subject category.',
      },
    }),
    prisma.rankingMetric.upsert({
      where: { code: 'SUBJECT_RANK' },
      update: {
        displayName: 'Subject Rank',
        metricType: RankingMetricType.RANK,
      },
      create: {
        id: ids.metrics.rank,
        code: 'SUBJECT_RANK',
        displayName: 'Subject Rank',
        metricType: RankingMetricType.RANK,
        description: 'Ordinal rank within a subject category.',
      },
    }),
    prisma.rankingMetric.upsert({
      where: { code: 'SJR' },
      update: {
        displayName: 'SJR',
        metricType: RankingMetricType.SCORE,
      },
      create: {
        id: ids.metrics.sjr,
        code: 'SJR',
        displayName: 'SJR',
        metricType: RankingMetricType.SCORE,
        description: 'SCImago Journal Rank score.',
      },
    }),
    prisma.rankingMetric.upsert({
      where: { code: 'CITESCORE' },
      update: {
        displayName: 'CiteScore',
        metricType: RankingMetricType.SCORE,
      },
      create: {
        id: ids.metrics.citeScore,
        code: 'CITESCORE',
        displayName: 'CiteScore',
        metricType: RankingMetricType.SCORE,
        description: 'Citation impact score for a journal.',
      },
    }),
  ]);
}

async function seedJournals() {
  await Promise.all([
    prisma.journal.upsert({
      where: { id: ids.journals.aiReview },
      update: {
        sourceId: 'SCILAB-J-1001',
        publisherId: ids.publishers.springer,
        countryId: ids.zones.uk,
        regionId: ids.zones.europe,
        displayName: 'Journal of Applied AI Review',
        type: 'journal',
        isOpenAccess: true,
        isOaDiamond: false,
        coverage: '2018-2026',
      },
      create: {
        id: ids.journals.aiReview,
        sourceId: 'SCILAB-J-1001',
        publisherId: ids.publishers.springer,
        countryId: ids.zones.uk,
        regionId: ids.zones.europe,
        displayName: 'Journal of Applied AI Review',
        type: 'journal',
        isOpenAccess: true,
        isOaDiamond: false,
        coverage: '2018-2026',
      },
    }),
    prisma.journal.upsert({
      where: { id: ids.journals.softwareSystems },
      update: {
        sourceId: 'SCILAB-J-1002',
        publisherId: ids.publishers.ieee,
        countryId: ids.zones.usa,
        regionId: ids.zones.northAmerica,
        displayName: 'Software Systems and Quality',
        type: 'journal',
        isOpenAccess: false,
        isOaDiamond: false,
        coverage: '2015-2026',
      },
      create: {
        id: ids.journals.softwareSystems,
        sourceId: 'SCILAB-J-1002',
        publisherId: ids.publishers.ieee,
        countryId: ids.zones.usa,
        regionId: ids.zones.northAmerica,
        displayName: 'Software Systems and Quality',
        type: 'journal',
        isOpenAccess: false,
        isOaDiamond: false,
        coverage: '2015-2026',
      },
    }),
    prisma.journal.upsert({
      where: { id: ids.journals.digitalHealth },
      update: {
        sourceId: 'SCILAB-J-1003',
        publisherId: ids.publishers.elsevier,
        countryId: ids.zones.vietnam,
        regionId: ids.zones.asiaPacific,
        displayName: 'Digital Health Frontiers',
        type: 'journal',
        isOpenAccess: true,
        isOaDiamond: true,
        coverage: '2020-2026',
      },
      create: {
        id: ids.journals.digitalHealth,
        sourceId: 'SCILAB-J-1003',
        publisherId: ids.publishers.elsevier,
        countryId: ids.zones.vietnam,
        regionId: ids.zones.asiaPacific,
        displayName: 'Digital Health Frontiers',
        type: 'journal',
        isOpenAccess: true,
        isOaDiamond: true,
        coverage: '2020-2026',
      },
    }),
    prisma.journal.upsert({
      where: { id: ids.journals.climateData },
      update: {
        sourceId: 'SCILAB-J-1004',
        publisherId: ids.publishers.springer,
        countryId: ids.zones.usa,
        regionId: ids.zones.northAmerica,
        displayName: 'Climate Data and Sustainability',
        type: 'journal',
        isOpenAccess: true,
        isOaDiamond: false,
        coverage: '2019-2026',
      },
      create: {
        id: ids.journals.climateData,
        sourceId: 'SCILAB-J-1004',
        publisherId: ids.publishers.springer,
        countryId: ids.zones.usa,
        regionId: ids.zones.northAmerica,
        displayName: 'Climate Data and Sustainability',
        type: 'journal',
        isOpenAccess: true,
        isOaDiamond: false,
        coverage: '2019-2026',
      },
    }),
  ]);

  await Promise.all([
    prisma.journalIssn.upsert({
      where: { id: ids.issns.aiPrint },
      update: { journalId: ids.journals.aiReview, issn: '2049-3630' },
      create: {
        id: ids.issns.aiPrint,
        journalId: ids.journals.aiReview,
        issn: '2049-3630',
      },
    }),
    prisma.journalIssn.upsert({
      where: { id: ids.issns.aiOnline },
      update: { journalId: ids.journals.aiReview, issn: '2049-3649' },
      create: {
        id: ids.issns.aiOnline,
        journalId: ids.journals.aiReview,
        issn: '2049-3649',
      },
    }),
    prisma.journalIssn.upsert({
      where: { id: ids.issns.softwarePrint },
      update: { journalId: ids.journals.softwareSystems, issn: '2168-6750' },
      create: {
        id: ids.issns.softwarePrint,
        journalId: ids.journals.softwareSystems,
        issn: '2168-6750',
      },
    }),
    prisma.journalIssn.upsert({
      where: { id: ids.issns.healthOnline },
      update: { journalId: ids.journals.digitalHealth, issn: '2673-253X' },
      create: {
        id: ids.issns.healthOnline,
        journalId: ids.journals.digitalHealth,
        issn: '2673-253X',
      },
    }),
    prisma.journalIssn.upsert({
      where: { id: ids.issns.climatePrint },
      update: { journalId: ids.journals.climateData, issn: '2662-9992' },
      create: {
        id: ids.issns.climatePrint,
        journalId: ids.journals.climateData,
        issn: '2662-9992',
      },
    }),
  ]);

  await Promise.all([
    prisma.journalSubjectCategory.upsert({
      where: {
        journalId_subjectCategoryId: {
          journalId: ids.journals.aiReview,
          subjectCategoryId: ids.subjectCategories.ai,
        },
      },
      update: {},
      create: {
        journalId: ids.journals.aiReview,
        subjectCategoryId: ids.subjectCategories.ai,
      },
    }),
    prisma.journalSubjectCategory.upsert({
      where: {
        journalId_subjectCategoryId: {
          journalId: ids.journals.softwareSystems,
          subjectCategoryId: ids.subjectCategories.software,
        },
      },
      update: {},
      create: {
        journalId: ids.journals.softwareSystems,
        subjectCategoryId: ids.subjectCategories.software,
      },
    }),
    prisma.journalSubjectCategory.upsert({
      where: {
        journalId_subjectCategoryId: {
          journalId: ids.journals.digitalHealth,
          subjectCategoryId: ids.subjectCategories.publicHealth,
        },
      },
      update: {},
      create: {
        journalId: ids.journals.digitalHealth,
        subjectCategoryId: ids.subjectCategories.publicHealth,
      },
    }),
    prisma.journalSubjectCategory.upsert({
      where: {
        journalId_subjectCategoryId: {
          journalId: ids.journals.climateData,
          subjectCategoryId: ids.subjectCategories.sustainability,
        },
      },
      update: {},
      create: {
        journalId: ids.journals.climateData,
        subjectCategoryId: ids.subjectCategories.sustainability,
      },
    }),
  ]);
}

async function seedRankings() {
  await Promise.all([
    prisma.journalRanking.upsert({
      where: { id: ids.rankings.aiQuartile },
      update: {
        valueText: 'Q1',
        valueInt: 1,
        valueFloat: null,
      },
      create: {
        id: ids.rankings.aiQuartile,
        journalId: ids.journals.aiReview,
        subjectCategoryId: ids.subjectCategories.ai,
        source: RankingSource.SCIMAGO,
        metricId: ids.metrics.quartile,
        year: 2025,
        valueText: 'Q1',
        valueInt: 1,
      },
    }),
    prisma.journalRanking.upsert({
      where: { id: ids.rankings.aiSjr },
      update: {
        valueText: '1.842',
        valueFloat: 1.842,
      },
      create: {
        id: ids.rankings.aiSjr,
        journalId: ids.journals.aiReview,
        subjectCategoryId: ids.subjectCategories.ai,
        source: RankingSource.SCIMAGO,
        metricId: ids.metrics.sjr,
        year: 2025,
        valueText: '1.842',
        valueFloat: 1.842,
      },
    }),
    prisma.journalRanking.upsert({
      where: { id: ids.rankings.softwareQuartile },
      update: {
        valueText: 'Q2',
        valueInt: 2,
      },
      create: {
        id: ids.rankings.softwareQuartile,
        journalId: ids.journals.softwareSystems,
        subjectCategoryId: ids.subjectCategories.software,
        source: RankingSource.SCOPUS,
        metricId: ids.metrics.quartile,
        year: 2025,
        valueText: 'Q2',
        valueInt: 2,
      },
    }),
    prisma.journalRanking.upsert({
      where: { id: ids.rankings.healthCiteScore },
      update: {
        valueText: '8.6',
        valueFloat: 8.6,
      },
      create: {
        id: ids.rankings.healthCiteScore,
        journalId: ids.journals.digitalHealth,
        subjectCategoryId: ids.subjectCategories.publicHealth,
        source: RankingSource.SCOPUS,
        metricId: ids.metrics.citeScore,
        year: 2024,
        valueText: '8.6',
        valueFloat: 8.6,
      },
    }),
    prisma.journalRanking.upsert({
      where: { id: ids.rankings.climateRank },
      update: {
        valueText: '#18',
        valueInt: 18,
      },
      create: {
        id: ids.rankings.climateRank,
        journalId: ids.journals.climateData,
        subjectCategoryId: ids.subjectCategories.sustainability,
        source: RankingSource.WOS,
        metricId: ids.metrics.rank,
        year: 2024,
        valueText: '#18',
        valueInt: 18,
      },
    }),
  ]);
}

async function seedPublications() {
  await Promise.all([
    prisma.volume.upsert({
      where: { id: ids.volumes.ai2025 },
      update: {
        journalId: ids.journals.aiReview,
        volumeNumber: 12,
        publicationYear: 2025,
      },
      create: {
        id: ids.volumes.ai2025,
        journalId: ids.journals.aiReview,
        volumeNumber: 12,
        publicationYear: 2025,
      },
    }),
    prisma.volume.upsert({
      where: { id: ids.volumes.software2025 },
      update: {
        journalId: ids.journals.softwareSystems,
        volumeNumber: 9,
        publicationYear: 2025,
      },
      create: {
        id: ids.volumes.software2025,
        journalId: ids.journals.softwareSystems,
        volumeNumber: 9,
        publicationYear: 2025,
      },
    }),
    prisma.volume.upsert({
      where: { id: ids.volumes.health2024 },
      update: {
        journalId: ids.journals.digitalHealth,
        volumeNumber: 5,
        publicationYear: 2024,
      },
      create: {
        id: ids.volumes.health2024,
        journalId: ids.journals.digitalHealth,
        volumeNumber: 5,
        publicationYear: 2024,
      },
    }),
    prisma.volume.upsert({
      where: { id: ids.volumes.climate2024 },
      update: {
        journalId: ids.journals.climateData,
        volumeNumber: 7,
        publicationYear: 2024,
      },
      create: {
        id: ids.volumes.climate2024,
        journalId: ids.journals.climateData,
        volumeNumber: 7,
        publicationYear: 2024,
      },
    }),
  ]);

  await Promise.all([
    prisma.issue.upsert({
      where: { id: ids.issues.ai2025Issue1 },
      update: {
        volumeId: ids.volumes.ai2025,
        issueNumber: '1',
        publicationYear: 2025,
      },
      create: {
        id: ids.issues.ai2025Issue1,
        volumeId: ids.volumes.ai2025,
        issueNumber: '1',
        publicationYear: 2025,
      },
    }),
    prisma.issue.upsert({
      where: { id: ids.issues.software2025Issue2 },
      update: {
        volumeId: ids.volumes.software2025,
        issueNumber: '2',
        publicationYear: 2025,
      },
      create: {
        id: ids.issues.software2025Issue2,
        volumeId: ids.volumes.software2025,
        issueNumber: '2',
        publicationYear: 2025,
      },
    }),
    prisma.issue.upsert({
      where: { id: ids.issues.health2024Issue1 },
      update: {
        volumeId: ids.volumes.health2024,
        issueNumber: '1',
        publicationYear: 2024,
      },
      create: {
        id: ids.issues.health2024Issue1,
        volumeId: ids.volumes.health2024,
        issueNumber: '1',
        publicationYear: 2024,
      },
    }),
    prisma.issue.upsert({
      where: { id: ids.issues.climate2024Issue3 },
      update: {
        volumeId: ids.volumes.climate2024,
        issueNumber: '3',
        publicationYear: 2024,
      },
      create: {
        id: ids.issues.climate2024Issue3,
        volumeId: ids.volumes.climate2024,
        issueNumber: '3',
        publicationYear: 2024,
      },
    }),
  ]);

  await Promise.all([
    prisma.topic.upsert({
      where: { id: ids.topics.neuralRetrieval },
      update: { displayName: 'Neural Information Retrieval', score: 0.94 },
      create: {
        id: ids.topics.neuralRetrieval,
        displayName: 'Neural Information Retrieval',
        score: 0.94,
      },
    }),
    prisma.topic.upsert({
      where: { id: ids.topics.reproducibility },
      update: { displayName: 'Research Reproducibility', score: 0.88 },
      create: {
        id: ids.topics.reproducibility,
        displayName: 'Research Reproducibility',
        score: 0.88,
      },
    }),
    prisma.topic.upsert({
      where: { id: ids.topics.digitalEpidemiology },
      update: { displayName: 'Digital Epidemiology', score: 0.91 },
      create: {
        id: ids.topics.digitalEpidemiology,
        displayName: 'Digital Epidemiology',
        score: 0.91,
      },
    }),
    prisma.topic.upsert({
      where: { id: ids.topics.climateModeling },
      update: { displayName: 'Regional Climate Modeling', score: 0.89 },
      create: {
        id: ids.topics.climateModeling,
        displayName: 'Regional Climate Modeling',
        score: 0.89,
      },
    }),
    prisma.topic.upsert({
      where: { id: ids.topics.dataGovernance },
      update: { displayName: 'Research Data Governance', score: 0.86 },
      create: {
        id: ids.topics.dataGovernance,
        displayName: 'Research Data Governance',
        score: 0.86,
      },
    }),
  ]);

  await Promise.all([
    prisma.article.upsert({
      where: { id: ids.articles.retrievalBenchmarks },
      update: {
        issueId: ids.issues.ai2025Issue1,
        title: 'Benchmarking Neural Retrieval Models for Scientific Discovery',
        publicationYear: 2025,
        primaryTopicId: ids.topics.neuralRetrieval,
      },
      create: {
        id: ids.articles.retrievalBenchmarks,
        version: 'v1',
        issueId: ids.issues.ai2025Issue1,
        title: 'Benchmarking Neural Retrieval Models for Scientific Discovery',
        abstract:
          'A comparative study of dense retrieval methods over scholarly corpora.',
        publicationYear: 2025,
        doi: '10.5555/scilab.2025.1001',
        primaryTopicId: ids.topics.neuralRetrieval,
      },
    }),
    prisma.article.upsert({
      where: { id: ids.articles.testAutomation },
      update: {
        issueId: ids.issues.software2025Issue2,
        title: 'Test Automation Strategies for Multi-Platform Research Tools',
        publicationYear: 2025,
        primaryTopicId: ids.topics.reproducibility,
      },
      create: {
        id: ids.articles.testAutomation,
        version: 'v2',
        issueId: ids.issues.software2025Issue2,
        title: 'Test Automation Strategies for Multi-Platform Research Tools',
        abstract:
          'An empirical report on test suites for web, mobile, and API research systems.',
        publicationYear: 2025,
        doi: '10.5555/scilab.2025.1002',
        primaryTopicId: ids.topics.reproducibility,
      },
    }),
    prisma.article.upsert({
      where: { id: ids.articles.mobileHealth },
      update: {
        issueId: ids.issues.health2024Issue1,
        title: 'Mobile Health Signals for Community-Level Early Warning',
        publicationYear: 2024,
        primaryTopicId: ids.topics.digitalEpidemiology,
      },
      create: {
        id: ids.articles.mobileHealth,
        version: 'v1',
        issueId: ids.issues.health2024Issue1,
        title: 'Mobile Health Signals for Community-Level Early Warning',
        abstract:
          'A framework for privacy-aware mobile health analytics in public health.',
        publicationYear: 2024,
        doi: '10.5555/scilab.2024.2001',
        primaryTopicId: ids.topics.digitalEpidemiology,
      },
    }),
    prisma.article.upsert({
      where: { id: ids.articles.regionalClimate },
      update: {
        issueId: ids.issues.climate2024Issue3,
        title: 'Regional Climate Risk Modeling with Open Data Pipelines',
        publicationYear: 2024,
        primaryTopicId: ids.topics.climateModeling,
      },
      create: {
        id: ids.articles.regionalClimate,
        version: 'v1',
        issueId: ids.issues.climate2024Issue3,
        title: 'Regional Climate Risk Modeling with Open Data Pipelines',
        abstract:
          'A reproducible pipeline for regional climate projection and decision support.',
        publicationYear: 2024,
        doi: '10.5555/scilab.2024.2002',
        primaryTopicId: ids.topics.climateModeling,
      },
    }),
  ]);
}

async function seedAuthorsKeywordsAndTopics() {
  await Promise.all([
    prisma.author.upsert({
      where: { orcid: '0000-0002-1825-0097' },
      update: { displayName: 'An Nguyen' },
      create: {
        id: ids.authors.anNguyen,
        orcid: '0000-0002-1825-0097',
        displayName: 'An Nguyen',
        imageUrl:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
      },
    }),
    prisma.author.upsert({
      where: { orcid: '0000-0002-1694-233X' },
      update: { displayName: 'Linh Tran' },
      create: {
        id: ids.authors.linhTran,
        orcid: '0000-0002-1694-233X',
        displayName: 'Linh Tran',
        imageUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      },
    }),
    prisma.author.upsert({
      where: { orcid: '0000-0003-1415-9265' },
      update: { displayName: 'Maya Chen' },
      create: {
        id: ids.authors.mayaChen,
        orcid: '0000-0003-1415-9265',
        displayName: 'Maya Chen',
        imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
      },
    }),
    prisma.author.upsert({
      where: { orcid: '0000-0001-5109-3700' },
      update: { displayName: 'David Smith' },
      create: {
        id: ids.authors.davidSmith,
        orcid: '0000-0001-5109-3700',
        displayName: 'David Smith',
        imageUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      },
    }),
  ]);

  await Promise.all([
    prisma.keyword.upsert({
      where: { displayName: 'machine learning' },
      update: {},
      create: {
        id: ids.keywords.machineLearning,
        displayName: 'machine learning',
      },
    }),
    prisma.keyword.upsert({
      where: { displayName: 'open science' },
      update: {},
      create: {
        id: ids.keywords.openScience,
        displayName: 'open science',
      },
    }),
    prisma.keyword.upsert({
      where: { displayName: 'health informatics' },
      update: {},
      create: {
        id: ids.keywords.healthInformatics,
        displayName: 'health informatics',
      },
    }),
    prisma.keyword.upsert({
      where: { displayName: 'climate risk' },
      update: {},
      create: {
        id: ids.keywords.climateRisk,
        displayName: 'climate risk',
      },
    }),
    prisma.keyword.upsert({
      where: { displayName: 'software quality' },
      update: {},
      create: {
        id: ids.keywords.softwareQuality,
        displayName: 'software quality',
      },
    }),
  ]);

  await Promise.all([
    prisma.authorArticle.upsert({
      where: {
        authorId_articleId: {
          authorId: ids.authors.anNguyen,
          articleId: ids.articles.retrievalBenchmarks,
        },
      },
      update: {},
      create: {
        authorId: ids.authors.anNguyen,
        articleId: ids.articles.retrievalBenchmarks,
      },
    }),
    prisma.authorArticle.upsert({
      where: {
        authorId_articleId: {
          authorId: ids.authors.mayaChen,
          articleId: ids.articles.retrievalBenchmarks,
        },
      },
      update: {},
      create: {
        authorId: ids.authors.mayaChen,
        articleId: ids.articles.retrievalBenchmarks,
      },
    }),
    prisma.authorArticle.upsert({
      where: {
        authorId_articleId: {
          authorId: ids.authors.linhTran,
          articleId: ids.articles.testAutomation,
        },
      },
      update: {},
      create: {
        authorId: ids.authors.linhTran,
        articleId: ids.articles.testAutomation,
      },
    }),
    prisma.authorArticle.upsert({
      where: {
        authorId_articleId: {
          authorId: ids.authors.mayaChen,
          articleId: ids.articles.mobileHealth,
        },
      },
      update: {},
      create: {
        authorId: ids.authors.mayaChen,
        articleId: ids.articles.mobileHealth,
      },
    }),
    prisma.authorArticle.upsert({
      where: {
        authorId_articleId: {
          authorId: ids.authors.davidSmith,
          articleId: ids.articles.regionalClimate,
        },
      },
      update: {},
      create: {
        authorId: ids.authors.davidSmith,
        articleId: ids.articles.regionalClimate,
      },
    }),
  ]);

  await Promise.all([
    prisma.keywordArticle.upsert({
      where: {
        keywordId_articleId: {
          keywordId: ids.keywords.machineLearning,
          articleId: ids.articles.retrievalBenchmarks,
        },
      },
      update: { score: 0.96 },
      create: {
        keywordId: ids.keywords.machineLearning,
        articleId: ids.articles.retrievalBenchmarks,
        score: 0.96,
      },
    }),
    prisma.keywordArticle.upsert({
      where: {
        keywordId_articleId: {
          keywordId: ids.keywords.openScience,
          articleId: ids.articles.retrievalBenchmarks,
        },
      },
      update: { score: 0.72 },
      create: {
        keywordId: ids.keywords.openScience,
        articleId: ids.articles.retrievalBenchmarks,
        score: 0.72,
      },
    }),
    prisma.keywordArticle.upsert({
      where: {
        keywordId_articleId: {
          keywordId: ids.keywords.softwareQuality,
          articleId: ids.articles.testAutomation,
        },
      },
      update: { score: 0.93 },
      create: {
        keywordId: ids.keywords.softwareQuality,
        articleId: ids.articles.testAutomation,
        score: 0.93,
      },
    }),
    prisma.keywordArticle.upsert({
      where: {
        keywordId_articleId: {
          keywordId: ids.keywords.healthInformatics,
          articleId: ids.articles.mobileHealth,
        },
      },
      update: { score: 0.91 },
      create: {
        keywordId: ids.keywords.healthInformatics,
        articleId: ids.articles.mobileHealth,
        score: 0.91,
      },
    }),
    prisma.keywordArticle.upsert({
      where: {
        keywordId_articleId: {
          keywordId: ids.keywords.climateRisk,
          articleId: ids.articles.regionalClimate,
        },
      },
      update: { score: 0.9 },
      create: {
        keywordId: ids.keywords.climateRisk,
        articleId: ids.articles.regionalClimate,
        score: 0.9,
      },
    }),
  ]);

  await Promise.all([
    prisma.subTopic.upsert({
      where: {
        articleId_topicId: {
          articleId: ids.articles.retrievalBenchmarks,
          topicId: ids.topics.reproducibility,
        },
      },
      update: {},
      create: {
        articleId: ids.articles.retrievalBenchmarks,
        topicId: ids.topics.reproducibility,
      },
    }),
    prisma.subTopic.upsert({
      where: {
        articleId_topicId: {
          articleId: ids.articles.testAutomation,
          topicId: ids.topics.dataGovernance,
        },
      },
      update: {},
      create: {
        articleId: ids.articles.testAutomation,
        topicId: ids.topics.dataGovernance,
      },
    }),
    prisma.subTopic.upsert({
      where: {
        articleId_topicId: {
          articleId: ids.articles.mobileHealth,
          topicId: ids.topics.dataGovernance,
        },
      },
      update: {},
      create: {
        articleId: ids.articles.mobileHealth,
        topicId: ids.topics.dataGovernance,
      },
    }),
    prisma.subTopic.upsert({
      where: {
        articleId_topicId: {
          articleId: ids.articles.regionalClimate,
          topicId: ids.topics.dataGovernance,
        },
      },
      update: {},
      create: {
        articleId: ids.articles.regionalClimate,
        topicId: ids.topics.dataGovernance,
      },
    }),
  ]);
}

async function main() {
  await seedUsers();
  await seedPublishersAndZones();
  await seedSubjectsAndMetrics();
  await seedJournals();
  await seedRankings();
  await seedPublications();
  await seedAuthorsKeywordsAndTopics();

  console.info('Seed completed successfully.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
