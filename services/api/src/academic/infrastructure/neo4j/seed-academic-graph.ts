import 'dotenv/config';

import { Neo4jAcademicGraphRepository } from '@/academic/infrastructure/neo4j/neo4j-academic-graph.repository';
import { Neo4jService } from '@/neo4j/neo4j.service';

const ids = {
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
  topics: {
    neuralRetrieval: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    reproducibility: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    digitalEpidemiology: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    climateModeling: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
    dataGovernance: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
  },
};

const journals = {
  aiReview: {
    id: ids.journals.aiReview,
    sourceId: 'SCILAB-J-1001',
    displayName: 'Journal of Applied AI Review',
    type: 'journal',
    isOpenAccess: true,
    isOaDiamond: false,
    coverage: '2018-2026',
    country: 'United Kingdom',
    region: 'Europe',
    issnList: ['2049-3630', '2049-3649'],
    publisherName: 'Springer Nature',
    publisherImageUrl: 'https://www.springernature.com/favicon.ico',
    subjectCategories: ['Artificial Intelligence'],
  },
  softwareSystems: {
    id: ids.journals.softwareSystems,
    sourceId: 'SCILAB-J-1002',
    displayName: 'Software Systems and Quality',
    type: 'journal',
    isOpenAccess: false,
    isOaDiamond: false,
    coverage: '2015-2026',
    country: 'United States',
    region: 'North America',
    issnList: ['2168-6750'],
    publisherName: 'IEEE',
    publisherImageUrl: 'https://www.ieee.org/favicon.ico',
    subjectCategories: ['Software Engineering'],
  },
  digitalHealth: {
    id: ids.journals.digitalHealth,
    sourceId: 'SCILAB-J-1003',
    displayName: 'Digital Health Frontiers',
    type: 'journal',
    isOpenAccess: true,
    isOaDiamond: true,
    coverage: '2020-2026',
    country: 'Vietnam',
    region: 'Asia Pacific',
    issnList: ['2734-7210'],
    publisherName: 'Elsevier',
    publisherImageUrl: 'https://www.elsevier.com/favicon.ico',
    subjectCategories: ['Public Health'],
  },
  climateData: {
    id: ids.journals.climateData,
    sourceId: 'SCILAB-J-1004',
    displayName: 'Climate Data and Sustainability',
    type: 'journal',
    isOpenAccess: true,
    isOaDiamond: false,
    coverage: '2019-2026',
    country: 'United States',
    region: 'North America',
    issnList: ['2666-9120'],
    publisherName: 'Springer Nature',
    publisherImageUrl: 'https://www.springernature.com/favicon.ico',
    subjectCategories: ['Sustainability'],
  },
};

const articleGraphs = [
  {
    article: {
      id: ids.articles.retrievalBenchmarks,
      title: 'Benchmarking Neural Retrieval Models for Scientific Discovery',
      abstract:
        'A comparative study of dense retrieval methods over scholarly corpora.',
      doi: '10.5555/scilab.2025.1001',
      publicationYear: 2025,
      version: 'v1',
      volumeNumber: 12,
      issueNumber: '1',
      createdAt: '2026-06-01T02:00:00.000Z',
    },
    journal: journals.aiReview,
    authors: [
      {
        id: ids.authors.anNguyen,
        orcid: '0000-0002-1825-0097',
        displayName: 'An Nguyen',
        imageUrl:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
        authorPosition: 1,
      },
      {
        id: ids.authors.mayaChen,
        orcid: '0000-0003-1415-9265',
        displayName: 'Maya Chen',
        imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
        authorPosition: 2,
      },
    ],
    keywords: [
      {
        id: ids.keywords.machineLearning,
        displayName: 'machine learning',
        score: 0.96,
      },
      {
        id: ids.keywords.openScience,
        displayName: 'open science',
        score: 0.72,
      },
    ],
    topics: [
      {
        id: ids.topics.neuralRetrieval,
        displayName: 'Neural Information Retrieval',
        score: 0.94,
        isPrimary: true,
      },
      {
        id: ids.topics.reproducibility,
        displayName: 'Research Reproducibility',
        score: 0.64,
        isPrimary: false,
      },
    ],
    citedArticleIds: [ids.articles.testAutomation],
  },
  {
    article: {
      id: ids.articles.testAutomation,
      title: 'Test Automation Strategies for Multi-Platform Research Tools',
      abstract:
        'An empirical report on test suites for web, mobile, and API research systems.',
      doi: '10.5555/scilab.2025.1002',
      publicationYear: 2025,
      version: 'v2',
      volumeNumber: 9,
      issueNumber: '2',
      createdAt: '2026-06-01T02:01:00.000Z',
    },
    journal: journals.softwareSystems,
    authors: [
      {
        id: ids.authors.linhTran,
        orcid: '0000-0002-1694-233X',
        displayName: 'Linh Tran',
        imageUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        authorPosition: 1,
      },
    ],
    keywords: [
      {
        id: ids.keywords.softwareQuality,
        displayName: 'software quality',
        score: 0.93,
      },
      {
        id: ids.keywords.openScience,
        displayName: 'open science',
        score: 0.67,
      },
    ],
    topics: [
      {
        id: ids.topics.reproducibility,
        displayName: 'Research Reproducibility',
        score: 0.88,
        isPrimary: true,
      },
      {
        id: ids.topics.dataGovernance,
        displayName: 'Research Data Governance',
        score: 0.59,
        isPrimary: false,
      },
    ],
  },
  {
    article: {
      id: ids.articles.mobileHealth,
      title: 'Mobile Health Signals for Community-Level Early Warning',
      abstract:
        'A framework for privacy-aware mobile health analytics in public health.',
      doi: '10.5555/scilab.2024.2001',
      publicationYear: 2024,
      version: 'v1',
      volumeNumber: 5,
      issueNumber: '1',
      createdAt: '2026-06-01T02:02:00.000Z',
    },
    journal: journals.digitalHealth,
    authors: [
      {
        id: ids.authors.mayaChen,
        orcid: '0000-0003-1415-9265',
        displayName: 'Maya Chen',
        imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
        authorPosition: 1,
      },
    ],
    keywords: [
      {
        id: ids.keywords.healthInformatics,
        displayName: 'health informatics',
        score: 0.91,
      },
    ],
    topics: [
      {
        id: ids.topics.digitalEpidemiology,
        displayName: 'Digital Epidemiology',
        score: 0.91,
        isPrimary: true,
      },
      {
        id: ids.topics.dataGovernance,
        displayName: 'Research Data Governance',
        score: 0.62,
        isPrimary: false,
      },
    ],
    citedArticleIds: [ids.articles.retrievalBenchmarks],
  },
  {
    article: {
      id: ids.articles.regionalClimate,
      title: 'Regional Climate Risk Modeling with Open Data Pipelines',
      abstract:
        'A reproducible pipeline for regional climate projection and decision support.',
      doi: '10.5555/scilab.2024.2002',
      publicationYear: 2024,
      version: 'v1',
      volumeNumber: 7,
      issueNumber: '3',
      createdAt: '2026-06-01T02:03:00.000Z',
    },
    journal: journals.climateData,
    authors: [
      {
        id: ids.authors.davidSmith,
        orcid: '0000-0001-5109-3700',
        displayName: 'David Smith',
        imageUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        authorPosition: 1,
      },
    ],
    keywords: [
      {
        id: ids.keywords.climateRisk,
        displayName: 'climate risk',
        score: 0.9,
      },
      {
        id: ids.keywords.openScience,
        displayName: 'open science',
        score: 0.7,
      },
    ],
    topics: [
      {
        id: ids.topics.climateModeling,
        displayName: 'Regional Climate Modeling',
        score: 0.89,
        isPrimary: true,
      },
      {
        id: ids.topics.dataGovernance,
        displayName: 'Research Data Governance',
        score: 0.66,
        isPrimary: false,
      },
    ],
    citedArticleIds: [ids.articles.testAutomation],
  },
];

async function main() {
  const neo4j = new Neo4jService();
  const repository = new Neo4jAcademicGraphRepository(neo4j);

  try {
    await neo4j.verifyConnectivity();
    await repository.ensureSchema();

    for (const graph of articleGraphs) {
      await repository.upsertArticleGraph(graph);
    }

    console.info(`Seeded ${articleGraphs.length} Neo4j article graphs.`);
  } finally {
    await neo4j.onModuleDestroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
