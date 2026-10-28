import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Percent,
  Calendar,
} from 'lucide-react';

import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

import { useAdminMonthlyReport } from '../../hooks/useAdmin';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const MonthlyReportPage = () => {
  useDocumentTitle('Monthly Operations Report');
  const [searchParams, setSearchParams] = useSearchParams();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Read URL params or fallback to current
  const yearParam = parseInt(searchParams.get('year') || String(currentYear), 10);
  const monthParam = parseInt(searchParams.get('month') || String(currentMonth), 10);

  // Year choices: currentYear ± 3
  const yearOptions = useMemo(() => {
    const list = [];
    for (let y = currentYear - 3; y <= currentYear + 3; y++) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  // Query monthly report
  const { data, isLoading, isError, refetch } = useAdminMonthlyReport(yearParam, monthParam);

  const report = data?.data?.report || data?.report || {};

  const totalIncidents = Number(report.total_incidents || 0);
  const resolved = Number(report.resolved || 0);
  const pending = Number(report.pending || 0);
  const critical = Number(report.critical_count || 0);

  const resolutionRate =
    totalIncidents > 0 ? ((resolved / totalIncidents) * 100).toFixed(1) : '0.0';

  const handleYearChange = (newYear) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('year', String(newYear));
        return next;
      },
      { replace: true }
    );
  };

  const handleMonthChange = (newMonth) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('month', String(newMonth));
        return next;
      },
      { replace: true }
    );
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const selectedMonthName = MONTH_NAMES[monthParam - 1] || 'Current Month';

  return (
    <div className="space-y-6">
      {/* Tiny Print Stylesheet to hide non-printable chrome */}
      <style>{`
        @media print {
          nav, aside, header, .print-hide {
            display: none !important;
          }
          main, body, html {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .printable-report {
            padding: 24px !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Page Header (Hidden on print) */}
      <div className="print-hide">
        <PageHeader
          title="Monthly Dispatch & Resolution Report"
          subtitle="Executive metrics, incident volume, and emergency resolution rate"
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="md"
                icon={Printer}
                onClick={handlePrint}
              >
                Print Report
              </Button>
            </div>
          }
        />
      </div>

      {/* Date Selectors (Hidden on print) */}
      <Card className="p-4 sm:p-5 print-hide">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-ink font-semibold">
            <Calendar className="w-4 h-4 text-primary-600" />
            <span>Select Reporting Period</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Month Select */}
            <div className="w-40">
              <Select
                value={monthParam}
                onChange={(e) => handleMonthChange(parseInt(e.target.value, 10))}
                aria-label="Select report month"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Year Select */}
            <div className="w-32">
              <Select
                value={yearParam}
                onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
                aria-label="Select report year"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Printable Report Document Container */}
      <div className="printable-report bg-surface-card rounded-2xl border border-line shadow-soft p-6 sm:p-8 space-y-6">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-ink">SafeRoute Executive Report</h2>
            </div>
            <p className="text-sm text-ink-muted mt-1">
              Performance summary for <span className="font-semibold text-ink">{selectedMonthName} {yearParam}</span>
            </p>
          </div>

          <div className="text-xs text-ink-muted text-right">
            <p>Generated: {new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}</p>
            <p>System: SafeRoute Admin Dispatch Engine</p>
          </div>
        </div>

        {/* Report Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        ) : isError ? (
          <ErrorState
            title="Failed to generate report"
            description="Could not query monthly report metrics from database."
            onRetry={refetch}
          />
        ) : totalIncidents === 0 ? (
          <EmptyState
            icon={FileText}
            title="No activity recorded"
            description={`No incident reports or dispatches were recorded during ${selectedMonthName} ${yearParam}.`}
          />
        ) : (
          <div className="space-y-6">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Card 1: Total */}
              <div className="p-4 rounded-2xl bg-pastel-slate-bg border border-pastel-slate-text/20 text-pastel-slate-text flex flex-col justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Reports</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-ink mt-2">
                  {totalIncidents.toLocaleString()}
                </span>
                <span className="text-[11px] text-ink-muted mt-1">Logged emergencies</span>
              </div>

              {/* Card 2: Resolved */}
              <div className="p-4 rounded-2xl bg-pastel-mint-bg border border-pastel-mint-text/20 text-pastel-mint-text flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider">Resolved</span>
                  <CheckCircle2 className="w-4 h-4 opacity-75" />
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold text-pastel-mint-text mt-2">
                  {resolved.toLocaleString()}
                </span>
                <span className="text-[11px] text-pastel-mint-text/90 mt-1">Successfully handled</span>
              </div>

              {/* Card 3: Pending */}
              <div className="p-4 rounded-2xl bg-pastel-butter-bg border border-pastel-butter-text/20 text-pastel-butter-text flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider">Pending</span>
                  <Clock className="w-4 h-4 opacity-75" />
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold text-pastel-butter-text mt-2">
                  {pending.toLocaleString()}
                </span>
                <span className="text-[11px] text-pastel-butter-text/90 mt-1">Awaiting triage</span>
              </div>

              {/* Card 4: Critical */}
              <div className="p-4 rounded-2xl bg-pastel-rose-bg border border-pastel-rose-text/20 text-pastel-rose-text flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider">Critical</span>
                  <AlertTriangle className="w-4 h-4 opacity-75" />
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold text-pastel-rose-text mt-2">
                  {critical.toLocaleString()}
                </span>
                <span className="text-[11px] text-pastel-rose-text/90 mt-1">Life-threatening cases</span>
              </div>

              {/* Card 5: Resolution Rate */}
              <div className="p-4 rounded-2xl bg-pastel-lavender-bg border border-pastel-lavender-text/20 text-pastel-lavender-text flex flex-col justify-between col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider">Resolution Rate</span>
                  <Percent className="w-4 h-4 opacity-75" />
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold text-pastel-lavender-text mt-2">
                  {resolutionRate}%
                </span>
                <span className="text-[11px] text-pastel-lavender-text/90 mt-1">Cases closed successfully</span>
              </div>
            </div>

            {/* Performance Analysis Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-surface-page border border-line space-y-2">
              <h3 className="font-semibold text-sm text-ink flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-600" />
                <span>Operational Review & Insights</span>
              </h3>
              <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                During {selectedMonthName} {yearParam}, the emergency network handled a total of{' '}
                <strong className="text-ink">{totalIncidents}</strong> incidents with a resolution
                rate of <strong className="text-ink">{resolutionRate}%</strong>. Of the total incidents,{' '}
                <strong className="text-ink">{critical}</strong> were categorized as critical priority.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyReportPage;
