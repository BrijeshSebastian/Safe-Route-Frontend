import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserCheck,
  Users,
  Radio,
  MapPin,
  BarChart3,
  UserPlus,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import TypeIcon from '../../components/incident/TypeIcon';
import SeverityBadge from '../../components/incident/SeverityBadge';

import { useAdminDashboard, useAdminIncidents } from '../../hooks/useAdmin';
import { usePageVisible } from '../../hooks/usePageVisible';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { timeAgo } from '../../lib/format';
import { INCIDENT_STATUSES, INCIDENT_TYPE_LABELS } from '../../lib/constants';

export const AdminDashboardPage = () => {
  useDocumentTitle('Admin Dashboard');
  const isPageVisible = usePageVisible();

  // 1. Dashboard counters (polls every 30s)
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    isError: isDashboardError,
    refetch: refetchDashboard,
    dataUpdatedAt,
  } = useAdminDashboard();

  // 2. Pending incidents panel (size 5, polls every 30s)
  const {
    data: pendingData,
    isLoading: isLoadingPending,
    isError: isPendingError,
    refetch: refetchPending,
  } = useAdminIncidents(
    { status: INCIDENT_STATUSES.PENDING, size: 5 },
    {
      refetchInterval: isPageVisible ? 30000 : false,
      refetchIntervalInBackground: false,
    }
  );

  // 3. Verified incidents panel ("Needs a responder", size 5, polls every 30s)
  const {
    data: verifiedData,
    isLoading: isLoadingVerified,
    isError: isVerifiedError,
    refetch: refetchVerified,
  } = useAdminIncidents(
    { status: INCIDENT_STATUSES.VERIFIED, size: 5 },
    {
      refetchInterval: isPageVisible ? 30000 : false,
      refetchIntervalInBackground: false,
    }
  );

  const dashboard = dashboardData?.data?.dashboard || dashboardData?.dashboard || {};
  const pendingIncidents = Array.isArray(pendingData?.data) ? pendingData.data : [];
  const verifiedIncidents = Array.isArray(verifiedData?.data) ? verifiedData.data : [];

  const totalIncidents = Number(dashboard.totalIncidents ?? 0);
  const pendingCount = Number(dashboard.pendingIncidents ?? 0);
  const verifiedCount = Number(dashboard.verifiedIncidents ?? 0);
  const assignedCount = Number(dashboard.assignedIncidents ?? 0);
  const resolvedCount = Number(dashboard.resolvedIncidents ?? 0);
  const totalReporters = Number(dashboard.totalReporters ?? 0);
  const totalResponders = Number(dashboard.totalResponders ?? 0);

  const statCards = [
    {
      title: 'Total Incidents',
      count: totalIncidents,
      color: 'slate',
      bgClass: 'bg-pastel-slate-bg border-pastel-slate-text/20 text-pastel-slate-text',
      icon: AlertTriangle,
      link: '/admin/incidents',
    },
    {
      title: 'Pending Verification',
      count: pendingCount,
      color: 'butter',
      bgClass: 'bg-pastel-butter-bg border-pastel-butter-text/20 text-pastel-butter-text',
      icon: Clock,
      link: `/admin/incidents?status=${INCIDENT_STATUSES.PENDING}`,
    },
    {
      title: 'Verified Queue',
      count: verifiedCount,
      color: 'sky',
      bgClass: 'bg-pastel-sky-bg border-pastel-sky-text/20 text-pastel-sky-text',
      icon: ShieldCheck,
      link: `/admin/incidents?status=${INCIDENT_STATUSES.VERIFIED}`,
    },
    {
      title: 'Active Dispatches',
      count: assignedCount,
      color: 'lavender',
      bgClass: 'bg-pastel-lavender-bg border-pastel-lavender-text/20 text-pastel-lavender-text',
      icon: Radio,
      link: `/admin/incidents?status=${INCIDENT_STATUSES.ASSIGNED}`,
    },
    {
      title: 'Resolved',
      count: resolvedCount,
      color: 'mint',
      bgClass: 'bg-pastel-mint-bg border-pastel-mint-text/20 text-pastel-mint-text',
      icon: CheckCircle2,
      link: `/admin/incidents?status=${INCIDENT_STATUSES.RESOLVED}`,
    },
    {
      title: 'Reporters',
      count: totalReporters,
      color: 'peach',
      bgClass: 'bg-pastel-peach-bg border-pastel-peach-text/20 text-pastel-peach-text',
      icon: Users,
      link: '/admin/users?role=reporter',
    },
    {
      title: 'Responders',
      count: totalResponders,
      color: 'sky',
      bgClass: 'bg-pastel-sky-bg border-pastel-sky-text/20 text-pastel-sky-text',
      icon: UserCheck,
      link: '/admin/users?role=responder',
    },
  ];

  const handleRefreshAll = () => {
    refetchDashboard();
    refetchPending();
    refetchVerified();
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Quick Actions & Live Indicator */}
      <PageHeader
        title="Admin Command Center"
        subtitle="Live monitoring, emergency queue verification, and responder dispatch control"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              as={Link}
              to="/admin/responders/new"
              variant="secondary"
              size="sm"
              icon={UserPlus}
            >
              Add responder
            </Button>
            <Button
              as={Link}
              to="/admin/map"
              variant="secondary"
              size="sm"
              icon={MapPin}
            >
              Live map
            </Button>
            <Button
              as={Link}
              to="/admin/analytics"
              variant="primary"
              size="sm"
              icon={BarChart3}
            >
              Analytics
            </Button>
          </div>
        }
      />

      {/* Live Polling Info */}
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time sync active (every 30s)</span>
        </div>
        <button
          type="button"
          onClick={handleRefreshAll}
          className="hover:text-primary-600 underline"
        >
          Updated {dataUpdatedAt ? timeAgo(dataUpdatedAt) : 'just now'} · Refresh now
        </button>
      </div>

      {/* Metric Counters Grid */}
      {isLoadingDashboard ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : isDashboardError ? (
        <ErrorState
          title="Could not load dashboard statistics"
          description="Failed to connect to admin dashboard metrics service."
          onRetry={refetchDashboard}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                to={card.link}
                className="group block focus:outline-hidden"
              >
                <div
                  className={`rounded-2xl border p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-soft flex flex-col justify-between h-28 ${card.bgClass}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider line-clamp-1">
                      {card.title}
                    </span>
                    <Icon className="w-4 h-4 opacity-75 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {card.count.toLocaleString()}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Operational Queues: 2 Column Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Waiting for verification */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-pastel-butter-text" />
              <span>Waiting for Verification</span>
              {pendingIncidents.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-pastel-butter-bg text-pastel-butter-text border border-pastel-butter-text/20">
                  {pendingIncidents.length}
                </span>
              )}
            </div>
          }
          subtitle="Reports needing immediate review and authenticity verification"
          action={
            <Link
              to={`/admin/incidents?status=${INCIDENT_STATUSES.PENDING}`}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {isLoadingPending ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : isPendingError ? (
            <p className="text-xs text-rose-600 p-4 text-center">Failed to load pending queue.</p>
          ) : pendingIncidents.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-muted">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-ink text-sm">All caught up</p>
              <p className="text-ink-muted mt-0.5">No reports waiting for verification.</p>
            </div>
          ) : (
            <div className="divide-y divide-line -my-2">
              {pendingIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="py-3 flex items-center justify-between gap-3 group hover:bg-surface-page/50 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <TypeIcon type={incident.incident_type} size="sm" />
                    <div className="min-w-0">
                      <Link
                        to={`/admin/incidents/${incident.id}`}
                        className="font-semibold text-xs sm:text-sm text-ink hover:text-primary-600 truncate block"
                      >
                        {incident.title}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-ink-muted flex-wrap mt-0.5">
                        <span>{incident.reporter?.full_name || 'Anonymous Reporter'}</span>
                        <span>·</span>
                        <SeverityBadge severity={incident.severity} size="sm" />
                        <span>·</span>
                        <span>{timeAgo(incident.createdAt || incident.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    as={Link}
                    to={`/admin/incidents/${incident.id}`}
                    variant="primary"
                    size="sm"
                    className="shrink-0"
                  >
                    Review
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Panel 2: Needs a responder */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-pastel-sky-text" />
              <span>Needs a Responder</span>
              {verifiedIncidents.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-pastel-sky-bg text-pastel-sky-text border border-pastel-sky-text/20">
                  {verifiedIncidents.length}
                </span>
              )}
            </div>
          }
          subtitle="Verified emergencies ready to be dispatched to response units"
          action={
            <Link
              to={`/admin/incidents?status=${INCIDENT_STATUSES.VERIFIED}`}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {isLoadingVerified ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : isVerifiedError ? (
            <p className="text-xs text-rose-600 p-4 text-center">Failed to load verified queue.</p>
          ) : verifiedIncidents.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-muted">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-ink text-sm">All caught up</p>
              <p className="text-ink-muted mt-0.5">All verified emergencies have responders assigned.</p>
            </div>
          ) : (
            <div className="divide-y divide-line -my-2">
              {verifiedIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="py-3 flex items-center justify-between gap-3 group hover:bg-surface-page/50 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <TypeIcon type={incident.incident_type} size="sm" />
                    <div className="min-w-0">
                      <Link
                        to={`/admin/incidents/${incident.id}`}
                        className="font-semibold text-xs sm:text-sm text-ink hover:text-primary-600 truncate block"
                      >
                        {incident.title}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-ink-muted flex-wrap mt-0.5">
                        <span>{INCIDENT_TYPE_LABELS[incident.incident_type] || incident.incident_type}</span>
                        <span>·</span>
                        <SeverityBadge severity={incident.severity} size="sm" />
                        <span>·</span>
                        <span>{timeAgo(incident.createdAt || incident.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    as={Link}
                    to={`/admin/incidents/${incident.id}`}
                    variant="primary"
                    size="sm"
                    className="shrink-0"
                  >
                    Assign
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
