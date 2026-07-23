export type SyncStatus = "success" | "running" | "failed" | "delayed";

export type ErrorSeverity = "critical" | "warning" | "info";

export type PlatformMetric = {
  id: string;
  label: string;
  value: number;
  change: number;
  trend: "up" | "down";
};

export type SyncJob = {
  id: string;
  source: string;
  lastSyncTime: string;
  status: SyncStatus;
  recordsUpdated: number;
  durationMs: number;
};

export type ErrorLogEntry = {
  id: string;
  timestamp: string;
  severity: ErrorSeverity;
  service: string;
  message: string;
};

export type ApiFailure = {
  id: string;
  provider: string;
  endpoint: string;
  statusCode: number;
  timestamp: string;
  message: string;
};

export type SyncPerformancePoint = {
  time: string;
  records: number;
  duration: number;
};

export type DataGrowthPoint = {
  month: string;
  journals: number;
  articles: number;
  authors: number;
};

export type ApiAvailabilityPoint = {
  name: string;
  health: number;
  active: boolean;
};

export interface SystemHealthSnapshot {
  metrics: PlatformMetric[];
  syncJobs: SyncJob[];
  errorLogs: ErrorLogEntry[];
  recentFailures: ErrorLogEntry[];
  apiFailures: ApiFailure[];
  syncPerformance: SyncPerformancePoint[];
  dataGrowth: DataGrowthPoint[];
  apiAvailability: ApiAvailabilityPoint[];
  overallStatus: "operational" | "degraded" | "incident";
  uptimePercent: number;
}
