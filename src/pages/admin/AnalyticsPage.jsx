import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { format } from 'date-fns';
import { BarChart3, PieChart as PieIcon, TrendingUp, ShieldAlert } from 'lucide-react';

import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

import { useAdminAnalytics } from '../../hooks/useAdmin';
import { THEME_COLORS } from '../../lib/theme';
import {
  INCIDENT_TYPE_LABELS,
  SEVERITY_LABELS,
  STATUS_LABELS,
} from '../../lib/constants';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

// Pastel palette for Type Donut
const TYPE_COLORS = [
  '#5766D6', // primary
  '#1F6B4F', // mint
  '#9A4B1F', // peach
  '#A02B45', // rose
  '#503E93', // lavender
  '#1D5A8A', // sky
  '#7A5A00', // butter
  '#4A5068', // slate
  '#8E9BF5', // light primary
];

const SEVERITY_BAR_COLORS = {
  low: '#1F6B4F', // mint
  medium: '#B8860B', // butter
  high: '#EA580C', // peach
  critical: '#E11D48', // rose
};

// Custom Chart Tooltip
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-surface-card border border-line rounded-xl p-3 shadow-md text-xs">
        {label && <p className="font-semibold text-ink mb-1">{label}</p>}
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: data.color || data.payload?.fill || '#5766D6' }}
          />
          <span className="text-ink-soft">{data.name || 'Count'}:</span>
          <span className="font-bold text-ink">{data.value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const AnalyticsPage = () => {
  useDocumentTitle('Platform Analytics');
  const { data: analyticsData, isLoading, isError, refetch } = useAdminAnalytics();

  const analytics = analyticsData?.data?.analytics || analyticsData?.analytics || {};

  // 1. Incidents By Type (Donut)
  const typeData = useMemo(() => {
    const raw = Array.isArray(analytics.incidentsByType) ? analytics.incidentsByType : [];
    return raw.map((item) => ({
      name: INCIDENT_TYPE_LABELS[item.incident_type] || item.incident_type,
      rawType: item.incident_type,
      value: Number(item.count || 0),
    })).filter((i) => i.value > 0);
  }, [analytics.incidentsByType]);

  // 2. Incidents By Severity (Bar)
  const severityData = useMemo(() => {
    const raw = Array.isArray(analytics.incidentsBySeverity) ? analytics.incidentsBySeverity : [];
    const order = ['low', 'medium', 'high', 'critical'];
    return order.map((sev) => {
      const found = raw.find((r) => r.severity === sev);
      return {
        severity: sev,
        name: SEVERITY_LABELS[sev] || sev,
        count: found ? Number(found.count || 0) : 0,
        fill: SEVERITY_BAR_COLORS[sev] || '#5766D6',
      };
    });
  }, [analytics.incidentsBySeverity]);

  // 3. Incidents By Status (Horizontal Bar)
  const statusData = useMemo(() => {
    const raw = Array.isArray(analytics.incidentsByStatus) ? analytics.incidentsByStatus : [];
    return raw.map((item) => ({
      name: STATUS_LABELS[item.status] || item.status,
      count: Number(item.count || 0),
    })).filter((i) => i.count > 0);
  }, [analytics.incidentsByStatus]);

  // 4. Monthly Trend (Line / Area - chronological order)
  const trendData = useMemo(() => {
    const raw = Array.isArray(analytics.monthlyTrend) ? analytics.monthlyTrend : [];
    // The backend provides ORDER BY month DESC; reverse to chronological order
    const list = [...raw].reverse();
    return list.map((item) => {
      let formattedMonth = item.month;
      try {
        const [y, m] = item.month.split('-');
        const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
        formattedMonth = format(date, 'MMM yy');
      } catch {
        // Fallback
      }
      return {
        rawMonth: item.month,
        month: formattedMonth,
        count: Number(item.count || 0),
      };
    });
  }, [analytics.monthlyTrend]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency Analytics & Metrics"
        subtitle="Historical breakdowns, severity profiles, and system-wide dispatch trends"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load analytics"
          description="Failed to retrieve analytics datasets from server."
          onRetry={refetch}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Incidents by Type (Donut) */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-primary-600" />
                <span>Incidents by Emergency Type</span>
              </div>
            }
            subtitle="Proportional volume across emergency categories"
          >
            {typeData.length === 0 ? (
              <EmptyState title="No data recorded" description="No incidents recorded for type breakdown." />
            ) : (
              <div className="space-y-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {typeData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={TYPE_COLORS[index % TYPE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomChartTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Accessibility Text Summary */}
                <p className="text-xs text-ink-muted bg-surface-page p-2.5 rounded-xl border border-line/60">
                  <span className="font-semibold text-ink">Summary: </span>
                  {typeData.map((d) => `${d.name}: ${d.value}`).join(' · ')}
                </p>
              </div>
            )}
          </Card>

          {/* Chart 2: Incidents by Severity (Bar) */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-pastel-peach-text" />
                <span>Incidents by Severity Level</span>
              </div>
            }
            subtitle="Severity distribution across all logged emergencies"
          >
            {severityData.every((s) => s.count === 0) ? (
              <EmptyState title="No data recorded" description="No severity counts available." />
            ) : (
              <div className="space-y-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={severityData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={THEME_COLORS.line} vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke={THEME_COLORS.ink.soft}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        stroke={THEME_COLORS.ink.soft}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {severityData.map((entry, index) => (
                          <Cell key={`sev-cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Accessibility Text Summary */}
                <p className="text-xs text-ink-muted bg-surface-page p-2.5 rounded-xl border border-line/60">
                  <span className="font-semibold text-ink">Summary: </span>
                  {severityData.map((d) => `${d.name}: ${d.count}`).join(' · ')}
                </p>
              </div>
            )}
          </Card>

          {/* Chart 3: Incidents by Status (Horizontal Bar) */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-pastel-sky-text" />
                <span>Incidents by Status</span>
              </div>
            }
            subtitle="Current state distribution of platform emergencies"
          >
            {statusData.length === 0 ? (
              <EmptyState title="No data recorded" description="No status counts available." />
            ) : (
              <div className="space-y-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statusData}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={THEME_COLORS.line} horizontal={false} />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        stroke={THEME_COLORS.ink.soft}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke={THEME_COLORS.ink.soft}
                        tick={{ fontSize: 11 }}
                        width={100}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Bar dataKey="count" fill="#5766D6" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Accessibility Text Summary */}
                <p className="text-xs text-ink-muted bg-surface-page p-2.5 rounded-xl border border-line/60">
                  <span className="font-semibold text-ink">Summary: </span>
                  {statusData.map((d) => `${d.name}: ${d.count}`).join(' · ')}
                </p>
              </div>
            )}
          </Card>

          {/* Chart 4: Monthly Trend (Area Chart) */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Monthly Incident Volume (Last 12 Months)</span>
              </div>
            }
            subtitle="Incident report rate trajectory over time"
          >
            {trendData.length === 0 ? (
              <EmptyState title="No data recorded" description="No monthly timeline data recorded." />
            ) : (
              <div className="space-y-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trendData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5766D6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#5766D6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={THEME_COLORS.line} />
                      <XAxis
                        dataKey="month"
                        stroke={THEME_COLORS.ink.soft}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        stroke={THEME_COLORS.ink.soft}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#5766D6"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#trendGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {/* Accessibility Text Summary */}
                <p className="text-xs text-ink-muted bg-surface-page p-2.5 rounded-xl border border-line/60">
                  <span className="font-semibold text-ink">Summary: </span>
                  {trendData.map((d) => `${d.month}: ${d.count}`).join(' · ')}
                </p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
