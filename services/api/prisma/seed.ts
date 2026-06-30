import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'argon2';
import {
  AuthProvider,
  FollowObjectType,
  Gender,
  NotifyMode,
  NotificationObjectType,
  PrismaClient,
  RankingMetricType,
  RankingSource,
  RoleAccount,
  StatusAccount,
  SyncFrequency,
  SyncJobType,
  SyncSource,
  SyncStatus,
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
    student: '11111111-1111-4111-8111-111111111112',
    researcher: '11111111-1111-4111-8111-111111111113',
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
  articles: {
    retrievalBenchmarks: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    testAutomation: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    mobileHealth: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
    regionalClimate: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4',
  },
  keywords: {
    machineLearning: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
    openScience: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2',
  },
  topics: {
    neuralRetrieval: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    reproducibility: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  },
  rankings: {
    aiQuartile: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
    aiSjr: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
    softwareQuartile: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3',
    healthCiteScore: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee4',
    climateRank: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee5',
  },
  configs: {
    openAlex: '12121212-1212-4121-8121-121212121211',
    neo4j: '12121212-1212-4121-8121-121212121212',
  },
  bookmarks: {
    retrieval: '13131313-1313-4131-8131-131313131311',
    automation: '13131313-1313-4131-8131-131313131312',
  },
  follows: {
    journal: '14141414-1414-4141-8141-141414141411',
    keyword: '14141414-1414-4141-8141-141414141412',
    topic: '14141414-1414-4141-8141-141414141413',
  },
  notifications: {
    newArticle: '15151515-1515-4151-8151-151515151511',
  },
  syncLogs: {
    openAlex: '16161616-1616-4161-8161-161616161611',
  },
};

async function seedUsers() {
  const passwordHash = await hash('Password123!');

  await Promise.all([
    prisma.user.upsert({
      where: { email: 'student@scilab.local' },
      update: {
        password: passwordHash,
        firstName: 'An',
        lastName: 'Nguyen',
        status: StatusAccount.ACTIVE,
        role: RoleAccount.STUDENT,
      },
      create: {
        id: ids.users.student,
        email: 'student@scilab.local',
        password: passwordHash,
        type: AuthProvider.EMAIL,
        status: StatusAccount.ACTIVE,
        role: RoleAccount.STUDENT,
        firstName: 'An',
        lastName: 'Nguyen',
        dateOfBirth: new Date('1998-09-21'),
        gender: Gender.FEMALE,
      },
    }),
    prisma.user.upsert({
      where: { email: 'researcher@scilab.local' },
      update: {
        password: passwordHash,
        firstName: 'Maya',
        lastName: 'Chen',
        status: StatusAccount.ACTIVE,
        role: RoleAccount.RESEARCHER,
      },
      create: {
        id: ids.users.researcher,
        email: 'researcher@scilab.local',
        password: passwordHash,
        type: AuthProvider.GOOGLE,
        status: StatusAccount.ACTIVE,
        role: RoleAccount.RESEARCHER,
        firstName: 'Maya',
        lastName: 'Chen',
        imageUrl:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        dateOfBirth: new Date('1991-01-05'),
        gender: Gender.FEMALE,
      },
    }),
  ]);
}

async function seedSubjectsAndMetrics() {
  await Promise.all([
    prisma.subjectArea.upsert({
      where: { displayName: 'Computer Science' },
      update: {
        description: 'Computing, information systems, and software research.',
      },
      create: {
        id: ids.subjectAreas.computerScience,
        displayName: 'Computer Science',
        description: 'Computing, information systems, and software research.',
      },
    }),
    prisma.subjectArea.upsert({
      where: { displayName: 'Medicine' },
      update: {
        description: 'Clinical, public health, and biomedical research.',
      },
      create: {
        id: ids.subjectAreas.medicine,
        displayName: 'Medicine',
        description: 'Clinical, public health, and biomedical research.',
      },
    }),
    prisma.subjectArea.upsert({
      where: { displayName: 'Environmental Science' },
      update: {
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

async function seedOperations() {
  await Promise.all([
    prisma.systemConfig.upsert({
      where: { apiName: 'OpenAlex' },
      update: {
        apiEndpoint: 'https://api.openalex.org',
        syncFrequency: SyncFrequency.DAILY,
        isActive: true,
      },
      create: {
        id: ids.configs.openAlex,
        apiName: 'OpenAlex',
        apiEndpoint: 'https://api.openalex.org',
        syncFrequency: SyncFrequency.DAILY,
        isActive: true,
      },
    }),
    prisma.systemConfig.upsert({
      where: { apiName: 'Neo4j Orphan Reconciliation' },
      update: {
        apiEndpoint: 'neo4j://graph',
        syncFrequency: SyncFrequency.WEEKLY,
        isActive: true,
      },
      create: {
        id: ids.configs.neo4j,
        apiName: 'Neo4j Orphan Reconciliation',
        apiEndpoint: 'neo4j://graph',
        syncFrequency: SyncFrequency.WEEKLY,
        isActive: true,
      },
    }),
  ]);

  await prisma.syncLog.upsert({
    where: { id: ids.syncLogs.openAlex },
    update: {
      totalFetched: 4,
      totalInserted: 4,
      totalUpdated: 0,
      totalErrors: 0,
      status: SyncStatus.SUCCESS,
    },
    create: {
      id: ids.syncLogs.openAlex,
      configId: ids.configs.openAlex,
      source: SyncSource.OPENALEX,
      jobType: SyncJobType.SCHEDULED_SYNC,
      startedAt: new Date('2026-06-01T02:00:00.000Z'),
      finishedAt: new Date('2026-06-01T02:03:00.000Z'),
      totalFetched: 4,
      totalInserted: 4,
      status: SyncStatus.SUCCESS,
    },
  });
}

async function seedUserActivity() {
  await Promise.all([
    prisma.userBookmark.upsert({
      where: { id: ids.bookmarks.retrieval },
      update: {
        articleId: ids.articles.retrievalBenchmarks,
      },
      create: {
        id: ids.bookmarks.retrieval,
        userId: ids.users.student,
        articleId: ids.articles.retrievalBenchmarks,
      },
    }),
    prisma.userBookmark.upsert({
      where: { id: ids.bookmarks.automation },
      update: {
        articleId: ids.articles.testAutomation,
      },
      create: {
        id: ids.bookmarks.automation,
        userId: ids.users.researcher,
        articleId: ids.articles.testAutomation,
      },
    }),
    prisma.userFollow.upsert({
      where: { id: ids.follows.journal },
      update: {
        notifyMode: NotifyMode.IN_APP,
      },
      create: {
        id: ids.follows.journal,
        userId: ids.users.student,
        objectType: FollowObjectType.JOURNAL,
        objectId: ids.journals.aiReview,
        notifyMode: NotifyMode.IN_APP,
      },
    }),
    prisma.userFollow.upsert({
      where: { id: ids.follows.keyword },
      update: {
        notifyMode: NotifyMode.DAILY_EMAIL,
      },
      create: {
        id: ids.follows.keyword,
        userId: ids.users.student,
        objectType: FollowObjectType.KEYWORD,
        objectId: ids.keywords.machineLearning,
        notifyMode: NotifyMode.DAILY_EMAIL,
      },
    }),
    prisma.userFollow.upsert({
      where: { id: ids.follows.topic },
      update: {
        notifyMode: NotifyMode.WEEKLY_EMAIL,
      },
      create: {
        id: ids.follows.topic,
        userId: ids.users.researcher,
        objectType: FollowObjectType.TOPIC,
        objectId: ids.topics.reproducibility,
        notifyMode: NotifyMode.WEEKLY_EMAIL,
      },
    }),
    prisma.notification.upsert({
      where: { id: ids.notifications.newArticle },
      update: {
        title: 'New article in followed journal',
        message:
          'A new article was synchronized for Journal of Applied AI Review.',
        isRead: false,
      },
      create: {
        id: ids.notifications.newArticle,
        userId: ids.users.student,
        title: 'New article in followed journal',
        message:
          'A new article was synchronized for Journal of Applied AI Review.',
        relatedObjectType: NotificationObjectType.ARTICLE,
        relatedObjectId: ids.articles.retrievalBenchmarks,
      },
    }),
  ]);
}

async function main() {
  await seedUsers();
  await seedSubjectsAndMetrics();
  await seedRankings();
  await seedOperations();
  await seedUserActivity();

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
