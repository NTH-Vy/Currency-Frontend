import { describe, it, expect } from 'vitest';
import { buildDashboardCsv } from './adminDashboard';

describe('buildDashboardCsv', () => {
  it('exports dashboard metrics and activity logs with safe CSV formatting', () => {
    const csv = buildDashboardCsv({
      metrics: [
        { label: 'Rates', value: 12 },
        { label: 'News', value: 3 },
      ],
      activityLogs: [
        { username: 'Admin', description: 'Updated rate, now live' },
      ],
    });

    expect(csv).toContain('metric,value');
    expect(csv).toContain('Rates,12');
    expect(csv).toContain('"Admin","Updated rate, now live"');
  });
});
