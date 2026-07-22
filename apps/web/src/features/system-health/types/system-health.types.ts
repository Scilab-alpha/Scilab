export interface AdminJobProgress {
  current: number;
  total: number;
  percentage: number;
  message: string | null;
}

export interface AdminAcademicJob {
  id: string;
  name: string;
  queueName: string;
  dataType: string;
  source: string;
  cron: string;
  timeZone: string;
  schedulerStatus: "active" | "paused";
  status: string;
  progress: AdminJobProgress | null;
  lastError: string | null;
  lastRunAt: string | null;
  nextRunAt: string | null;
  pausedAt: string | null;
}

export interface AdminSyncLog {
  id: string;
  source: string;
  dataType: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  successCount: number;
  failureCount: number;
  errorDetail: string | null;
}

export interface AdminSyncLogPage {
  items: AdminSyncLog[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface AdminSyncLogParams {
  page?: number;
  pageSize?: number;
}
