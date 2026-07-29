// Placeholder fixture for the "Metrics" facet.
// Sample KPI snapshots for the Mission Control template.

export interface MetricFixture {
  id: string;
  label: string;
  value: string;
  trend: 'up' | 'down' | 'flat';
  trendValue: string;
  kind: string;
}

export const metrics: MetricFixture[] = [
  {
    id: 'met-1',
    label: 'Active Projects',
    value: '12',
    trend: 'up',
    trendValue: '+2 this month',
    kind: 'Operations',
  },
  {
    id: 'met-2',
    label: 'Open Tasks',
    value: '47',
    trend: 'down',
    trendValue: '-8 this week',
    kind: 'Operations',
  },
  {
    id: 'met-3',
    label: 'Support Response Time',
    value: '2.4h',
    trend: 'down',
    trendValue: '-0.6h vs last week',
    kind: 'Support',
  },
  {
    id: 'met-4',
    label: 'Customer Satisfaction',
    value: '94%',
    trend: 'up',
    trendValue: '+1% this quarter',
    kind: 'Support',
  },
  {
    id: 'met-5',
    label: 'Integrations Healthy',
    value: '4 of 5',
    trend: 'flat',
    trendValue: '1 needs attention',
    kind: 'Systems',
  },
  {
    id: 'met-6',
    label: 'Knowledge Articles',
    value: '38',
    trend: 'up',
    trendValue: '+5 this month',
    kind: 'Knowledge',
  },
];
