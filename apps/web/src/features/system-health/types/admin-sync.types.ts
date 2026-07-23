/**
 * Admin academic sync / system-health API contracts
 * (from https://scilab-api.epsilon.io.vn/api/docs).
 */

export const ADMIN_SYNC_SOURCES = ["OPENALEX", "SCIMAGO"] as const;
export type AdminSyncSource = (typeof ADMIN_SYNC_SOURCES)[number];

export const ADMIN_SYNC_JOB_TYPES = [
  "SCIMAGO_RELOAD",
  "JOURNAL_SOURCE_SYNC",
  "JOURNAL_ARTICLE_SYNC",
  "RELATED_WORK_SYNC",
  "RELATED_WORK_HYDRATION",
  "OUTGOING_REFERENCE_CRAWL",
  "REFERENCE_HYDRATION",
  "INCOMING_CITATION_CRAWL",
  "CITATION_COUNT_REFRESH",
] as const;
export type AdminSyncJobType = (typeof ADMIN_SYNC_JOB_TYPES)[number];

export const ADMIN_SYNC_STATUSES = [
  "RUNNING",
  "SUCCESS",
  "PARTIAL",
  "FAILED",
  "CANCELLED",
] as const;
export type AdminSyncStatus = (typeof ADMIN_SYNC_STATUSES)[number];

export const ADMIN_PIPELINE_JOB_IDS = [
  "scimago-reload",
  "journal-source-sync",
  "journal-article-sync",
  "related-work-sync",
  "related-work-hydration",
  "outgoing-reference",
  "reference-hydration",
  "incoming-citation",
  "citation-count-refresh",
] as const;
export type AdminPipelineJobId = (typeof ADMIN_PIPELINE_JOB_IDS)[number];

export type AdminJobActionBody = {
  reason?: string;
};

export type AdminSyncLog = {
  id: string;
  source: string;
  jobType: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  insertedCount?: number;
  updatedCount?: number;
  errorCount?: number;
  totalFetched?: number;
  totalInserted?: number;
  totalUpdated?: number;
  totalErrors?: number;
  sourceName?: string;
  errorDetail?: string | null;
  configId?: string;
};

export type AdminSyncLogsPage = {
  items: AdminSyncLog[];
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
};

export type AdminSyncLogListParams = {
  page?: number;
  pageSize?: number;
  source?: AdminSyncSource | "";
  dataType?: AdminSyncJobType | "";
  status?: AdminSyncStatus | "";
  startedFrom?: string;
  startedTo?: string;
};

export type AdminPipelineJob = {
  id: AdminPipelineJobId | string;
  name?: string;
  displayName?: string;
  description?: string;
  status?: string;
  state?: string;
  paused?: boolean;
  isPaused?: boolean;
  enabled?: boolean;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  lastStatus?: string | null;
  runningCount?: number;
  waitingCount?: number;
  failedCount?: number;
  queue?: string;
  scheduler?: string;
};

export type AdminJobsListData = {
  jobs?: AdminPipelineJob[];
  items?: AdminPipelineJob[];
};

export type AdminDashboardMetrics = {
  generatedAt: string;
  articleCount: number;
  journalCount: number;
  authorCount: number;
  userCount: number;
  summary: {
    articleCount: number;
    journalCount: number;
    authorCount: number;
    userCount: number;
  };
  users: {
    byStatus: { active: number; inactive: number; banned: number };
    byRole: { student: number; researcher: number; admin: number };
    registrations: { last7Days: number; last30Days: number };
  };
  engagement: {
    bookmarkCount: number;
    followCount: number;
    unreadNotificationCount: number;
  };
  sync: {
    runningJobCount: number;
    failedSyncCountLast24Hours: number;
    lastSyncAt: string | null;
    recentLogs: AdminSyncLog[];
  };
  growth: {
    last7Days: {
      articles: number;
      journals: number;
      authorsWithNewArticles: number;
    };
    last30Days: {
      articles: number;
      journals: number;
      authorsWithNewArticles: number;
    };
  };
  rankings: {
    topJournals: Array<{
      id: string;
      title: string | null;
      articleCount: number;
    }>;
    topArticles: Array<{
      id: string;
      title: string | null;
      citationCount: number;
      publicationYear: number | null;
    }>;
  };
  dataQuality: {
    hydratedArticles: number;
    placeholderArticles: number;
    missingDoi: number;
    missingAbstract: number;
    missingAuthors: number;
  };
  sources: Array<{
    id: string;
    name: string;
    isActive: boolean;
    lastTestedAt: string | null;
    latestSyncStatus: string | null;
    latestSyncAt: string | null;
    failedSyncCountLast24Hours: number;
  }>;
};

export const PIPELINE_JOB_LABELS: Record<AdminPipelineJobId, string> = {
  "scimago-reload": "SCImago reload",
  "journal-source-sync": "Journal source sync",
  "journal-article-sync": "Journal article sync",
  "related-work-sync": "Related work sync",
  "related-work-hydration": "Related work hydration",
  "outgoing-reference": "Outgoing reference crawl",
  "reference-hydration": "Reference hydration",
  "incoming-citation": "Incoming citation crawl",
  "citation-count-refresh": "Citation count refresh",
};

export const SYNC_JOB_TYPE_LABELS: Record<AdminSyncJobType, string> = {
  SCIMAGO_RELOAD: "SCImago reload",
  JOURNAL_SOURCE_SYNC: "Journal source sync",
  JOURNAL_ARTICLE_SYNC: "Journal article sync",
  RELATED_WORK_SYNC: "Related work sync",
  RELATED_WORK_HYDRATION: "Related work hydration",
  OUTGOING_REFERENCE_CRAWL: "Outgoing reference crawl",
  REFERENCE_HYDRATION: "Reference hydration",
  INCOMING_CITATION_CRAWL: "Incoming citation crawl",
  CITATION_COUNT_REFRESH: "Citation count refresh",
};

export function pipelineJobLabel(jobId: string) {
  return (
    PIPELINE_JOB_LABELS[jobId as AdminPipelineJobId] ??
    jobId.replace(/-/g, " ")
  );
}

export function syncJobTypeLabel(jobType: string) {
  return (
    SYNC_JOB_TYPE_LABELS[jobType as AdminSyncJobType] ??
    jobType.replace(/_/g, " ").toLowerCase()
  );
}
