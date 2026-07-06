export interface DashboardMetric {
  label: string;
  value: string | number;
}

export interface DashboardActivityLogLike {
  username?: string;
  description?: string;
  created_at?: string;
}

export interface DashboardExportPayload {
  metrics: DashboardMetric[];
  activityLogs: DashboardActivityLogLike[];
}

const escapeCsvValue = (value: string | number | undefined): string => {
  const normalized = `${value ?? ''}`.replace(/\r?\n/g, ' ');
  if (normalized.includes(',') || normalized.includes('"')) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
};

export const buildDashboardCsv = ({ metrics, activityLogs }: DashboardExportPayload): string => {
  const rows = [
    ['metric', 'value'],
    ...metrics.map((metric) => [metric.label, metric.value]),
    [],
    ['username', 'description', 'created_at'],
    ...activityLogs.map((log) => [log.username ?? '', log.description ?? '', log.created_at ?? '']),
  ];

  return rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');
};
