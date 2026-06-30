import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'argon2';
import {
  AuthProvider,
  FollowObjectType,
  Gender,
  NotifyMode,
  PrismaClient,
  RankingMetricType,
  RankingSource,
  RoleAccount,
  StatusAccount,
  SyncFrequency,
  SyncSource,
  SyncStatus,
} from '@prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const DEFAULT_DATABASE_SCHEMA = 'scilab_api';

function resolveDatabaseConfig(connectionString: string) {
  const url = new URL(connectionString);
  const schema = url.searchParams.get('schema') ?? DEFAULT_DATABASE_SCHEMA;

  url.searchParams.delete('schema');

  return {
    connectionString: url.toString(),
    schema,
  };
}

const database = resolveDatabaseConfig(connectionString);
const adapter = new PrismaPg(
  { connectionString: database.connectionString },
  { schema: database.schema },
);
const prisma = new PrismaClient({ adapter });

const ids = {
  users: {
    admin: '11111111-1111-4111-8111-111111111111',
    researcher: '11111111-1111-4111-8111-111111111112',
    student: '11111111-1111-4111-8111-111111111113',
  },
  subjects: {
    computerScience: '44444444-4444-4444-8444-444444444441',
    artificialIntelligence: '55555555-5555-4555-8555-555555555551',
    softwareEngineering: '55555555-5555-4555-8555-555555555552',
  },
  metrics: {
    worksCount: '66666666-6666-4666-8666-666666666661',
    citedByCount: '66666666-6666-4666-8666-666666666662',
    hIndex: '66666666-6666-4666-8666-666666666663',
  },
  graphRefs: {
    journal: '77777777-7777-4777-8777-777777777771',
    article: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    keyword: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
    topic: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  },
  rankings: {
    worksCount: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
    citedByCount: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
    hIndex: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3',
  },
  bookmarks: {
    studentArticle: 'ffffffff-ffff-4fff-8fff-fffffffffff1',
  },
  follows: {
    studentJournal: 'ffffffff-ffff-4fff-8fff-fffffffffff2',
    researcherTopic: 'ffffffff-ffff-4fff-8fff-fffffffffff3',
  },
  systemConfig: {
    openAlex: '99999999-9999-4999-8999-999999999991',
  },
  notification: {
    welcome: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeee1',
  },
  syncLog: {
    openAlex: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeee2',
  },
};

async function seedUsers() {
  const passwordHash = await hash('Password123!');

  await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@scilab.local' },
      update: {
        password: passwordHash,
        type: AuthProvider.EMAIL,
        firstName: 'SciLab',
        lastName: 'Admin',
        imageUrl: null,
        status: StatusAccount.ACTIVE,
        role: RoleAccount.ADMIN,
        dateOfBirth: new Date('1994-04-12'),
        gender: Gender.MALE,
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
        gender: Gender.MALE,
      },
    }),
    prisma.user.upsert({
      where: { email: 'researcher@scilab.local' },
      update: {
        password: passwordHash,
        type: AuthProvider.EMAIL,
        firstName: 'An',
        lastName: 'Nguyen',
        imageUrl: null,
        status: StatusAccount.ACTIVE,
        role: RoleAccount.RESEARCHER,
        dateOfBirth: new Date('1998-09-21'),
        gender: Gender.FEMALE,
      },
      create: {
        id: ids.users.researcher,
        email: 'researcher@scilab.local',
        password: passwordHash,
        type: AuthProvider.EMAIL,
        status: StatusAccount.ACTIVE,
        role: RoleAccount.RESEARCHER,
        firstName: 'An',
        lastName: 'Nguyen',
        dateOfBirth: new Date('1998-09-21'),
        gender: Gender.FEMALE,
      },
    }),
    prisma.user.upsert({
      where: { email: 'student@scilab.local' },
      update: {
        password: passwordHash,
        type: AuthProvider.GOOGLE,
        firstName: 'Maya',
        lastName: 'Chen',
        imageUrl:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        status: StatusAccount.ACTIVE,
        role: RoleAccount.STUDENT,
        dateOfBirth: new Date('1991-01-05'),
        gender: Gender.OTHER,
      },
      create: {
        id: ids.users.student,
        email: 'student@scilab.local',
        password: passwordHash,
        type: AuthProvider.GOOGLE,
        status: StatusAccount.ACTIVE,
        role: RoleAccount.STUDENT,
        firstName: 'Maya',
        lastName: 'Chen',
        imageUrl:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        dateOfBirth: new Date('1991-01-05'),
        gender: Gender.OTHER,
      },
    }),
  ]);
}

async function seedSystemConfig() {
  await prisma.systemConfig.upsert({
    where: { apiName: 'OpenAlex' },
    update: {
      apiEndpoint: 'https://api.openalex.org',
      syncFrequency: SyncFrequency.DAILY,
      isActive: true,
      lastTestedAt: null,
    },
    create: {
      id: ids.systemConfig.openAlex,
      apiName: 'OpenAlex',
      apiEndpoint: 'https://api.openalex.org',
      syncFrequency: SyncFrequency.DAILY,
      isActive: true,
    },
  });
}

async function seedSubjectsAndMetrics() {
  await prisma.subjectArea.upsert({
    where: { id: ids.subjects.computerScience },
    update: {
      displayName: 'Computer Science',
      description: 'Computing, information systems, and software research.',
    },
    create: {
      id: ids.subjects.computerScience,
      displayName: 'Computer Science',
      description: 'Computing, information systems, and software research.',
    },
  });

  await Promise.all([
    prisma.subjectCategory.upsert({
      where: { id: ids.subjects.artificialIntelligence },
      update: {
        subjectAreaId: ids.subjects.computerScience,
        displayName: 'Artificial Intelligence',
        description: 'Machine learning, reasoning, and intelligent systems.',
      },
      create: {
        id: ids.subjects.artificialIntelligence,
        subjectAreaId: ids.subjects.computerScience,
        displayName: 'Artificial Intelligence',
        description: 'Machine learning, reasoning, and intelligent systems.',
      },
    }),
    prisma.subjectCategory.upsert({
      where: { id: ids.subjects.softwareEngineering },
      update: {
        subjectAreaId: ids.subjects.computerScience,
        displayName: 'Software Engineering',
        description: 'Software process, quality, testing, and maintainability.',
      },
      create: {
        id: ids.subjects.softwareEngineering,
        subjectAreaId: ids.subjects.computerScience,
        displayName: 'Software Engineering',
        description: 'Software process, quality, testing, and maintainability.',
      },
    }),
  ]);

  await Promise.all([
    prisma.rankingMetric.upsert({
      where: { code: 'WORKS_COUNT' },
      update: {
        displayName: 'Works Count',
        metricType: RankingMetricType.SCORE,
      },
      create: {
        id: ids.metrics.worksCount,
        code: 'WORKS_COUNT',
        displayName: 'Works Count',
        metricType: RankingMetricType.SCORE,
        description: 'OpenAlex works_count metric for a source.',
      },
    }),
    prisma.rankingMetric.upsert({
      where: { code: 'CITED_BY_COUNT' },
      update: {
        displayName: 'Cited By Count',
        metricType: RankingMetricType.SCORE,
      },
      create: {
        id: ids.metrics.citedByCount,
        code: 'CITED_BY_COUNT',
        displayName: 'Cited By Count',
        metricType: RankingMetricType.SCORE,
        description: 'OpenAlex cited_by_count metric for a source.',
      },
    }),
    prisma.rankingMetric.upsert({
      where: { code: 'H_INDEX' },
      update: {
        displayName: 'H-Index',
        metricType: RankingMetricType.SCORE,
      },
      create: {
        id: ids.metrics.hIndex,
        code: 'H_INDEX',
        displayName: 'H-Index',
        metricType: RankingMetricType.SCORE,
        description: 'OpenAlex h_index metric for a source.',
      },
    }),
  ]);
}

async function seedJournalRankings() {
  await Promise.all([
    prisma.journalRanking.upsert({
      where: {
        journalId_subjectCategoryId_source_metricId_year: {
          journalId: ids.graphRefs.journal,
          subjectCategoryId: ids.subjects.artificialIntelligence,
          source: RankingSource.OPENALEX,
          metricId: ids.metrics.worksCount,
          year: 2026,
        },
      },
      update: {
        valueInt: 15420,
        valueText: '15420',
        valueFloat: null,
      },
      create: {
        id: ids.rankings.worksCount,
        journalId: ids.graphRefs.journal,
        subjectCategoryId: ids.subjects.artificialIntelligence,
        source: RankingSource.OPENALEX,
        metricId: ids.metrics.worksCount,
        year: 2026,
        valueText: '15420',
        valueInt: 15420,
      },
    }),
    prisma.journalRanking.upsert({
      where: {
        journalId_subjectCategoryId_source_metricId_year: {
          journalId: ids.graphRefs.journal,
          subjectCategoryId: ids.subjects.artificialIntelligence,
          source: RankingSource.OPENALEX,
          metricId: ids.metrics.citedByCount,
          year: 2026,
        },
      },
      update: {
        valueInt: 87340,
        valueText: '87340',
        valueFloat: null,
      },
      create: {
        id: ids.rankings.citedByCount,
        journalId: ids.graphRefs.journal,
        subjectCategoryId: ids.subjects.artificialIntelligence,
        source: RankingSource.OPENALEX,
        metricId: ids.metrics.citedByCount,
        year: 2026,
        valueText: '87340',
        valueInt: 87340,
      },
    }),
    prisma.journalRanking.upsert({
      where: {
        journalId_subjectCategoryId_source_metricId_year: {
          journalId: ids.graphRefs.journal,
          subjectCategoryId: ids.subjects.artificialIntelligence,
          source: RankingSource.OPENALEX,
          metricId: ids.metrics.hIndex,
          year: 2026,
        },
      },
      update: {
        valueInt: 112,
        valueText: '112',
        valueFloat: null,
      },
      create: {
        id: ids.rankings.hIndex,
        journalId: ids.graphRefs.journal,
        subjectCategoryId: ids.subjects.artificialIntelligence,
        source: RankingSource.OPENALEX,
        metricId: ids.metrics.hIndex,
        year: 2026,
        valueText: '112',
        valueInt: 112,
      },
    }),
  ]);
}

async function seedUserActivity() {
  await prisma.userBookmark.upsert({
    where: {
      userId_articleId: {
        userId: ids.users.student,
        articleId: ids.graphRefs.article,
      },
    },
    update: {},
    create: {
      id: ids.bookmarks.studentArticle,
      userId: ids.users.student,
      articleId: ids.graphRefs.article,
    },
  });

  await Promise.all([
    prisma.userFollow.upsert({
      where: {
        userId_objectType_objectId: {
          userId: ids.users.student,
          objectType: FollowObjectType.JOURNAL,
          objectId: ids.graphRefs.journal,
        },
      },
      update: { notifyMode: NotifyMode.DAILY },
      create: {
        id: ids.follows.studentJournal,
        userId: ids.users.student,
        objectType: FollowObjectType.JOURNAL,
        objectId: ids.graphRefs.journal,
        notifyMode: NotifyMode.DAILY,
      },
    }),
    prisma.userFollow.upsert({
      where: {
        userId_objectType_objectId: {
          userId: ids.users.researcher,
          objectType: FollowObjectType.TOPIC,
          objectId: ids.graphRefs.topic,
        },
      },
      update: { notifyMode: NotifyMode.IN_APP },
      create: {
        id: ids.follows.researcherTopic,
        userId: ids.users.researcher,
        objectType: FollowObjectType.TOPIC,
        objectId: ids.graphRefs.topic,
        notifyMode: NotifyMode.IN_APP,
      },
    }),
  ]);

  await prisma.notification.upsert({
    where: { id: ids.notification.welcome },
    update: {
      title: 'Welcome to SciLab',
      message: 'Your OpenAlex-powered research workspace is ready.',
      relatedObjectType: 'ARTICLE',
      relatedObjectId: ids.graphRefs.article,
      isRead: false,
    },
    create: {
      id: ids.notification.welcome,
      userId: ids.users.student,
      title: 'Welcome to SciLab',
      message: 'Your OpenAlex-powered research workspace is ready.',
      relatedObjectType: 'ARTICLE',
      relatedObjectId: ids.graphRefs.article,
    },
  });
}

async function seedSyncLogs() {
  await prisma.syncLog.upsert({
    where: { id: ids.syncLog.openAlex },
    update: {
      totalFetched: 500,
      totalInserted: 450,
      totalUpdated: 50,
      totalErrors: 0,
      status: SyncStatus.SUCCESS,
      errorDetail: null,
      finishedAt: new Date('2026-06-30T01:15:00.000Z'),
    },
    create: {
      id: ids.syncLog.openAlex,
      source: SyncSource.OPENALEX,
      startedAt: new Date('2026-06-30T01:00:00.000Z'),
      finishedAt: new Date('2026-06-30T01:15:00.000Z'),
      totalFetched: 500,
      totalInserted: 450,
      totalUpdated: 50,
      totalErrors: 0,
      status: SyncStatus.SUCCESS,
    },
  });
}

async function main() {
  await seedUsers();
  await seedSystemConfig();
  await seedSubjectsAndMetrics();
  await seedJournalRankings();
  await seedUserActivity();
  await seedSyncLogs();

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
