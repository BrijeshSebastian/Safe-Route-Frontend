import React from 'react';
import { Link } from 'react-router-dom';
import { Siren, CheckCircle2, Bell, Shield, ArrowRight } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Skeleton, { SkeletonCard } from '../../components/ui/Skeleton';
import AssignmentCard from '../../components/responder/AssignmentCard';
import { useAuthStore } from '../../store/authStore';
import { useResponderDashboard, useAssignments } from '../../hooks/useResponder';
import { readList } from '../../lib/pagination';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const ResponderDashboardPage = () => {
  useDocumentTitle('Responder Dashboard');
  const user = useAuthStore((s) => s.user);
  const firstName = user?.full_name?.split(' ')[0] || 'Responder';

  const {
    data: dashboard,
    isLoading: isDashLoading,
    isError: isDashError,
    error: dashError,
    refetch: refetchDashboard,
  } = useResponderDashboard();

  // Fetch pending new dispatches for this responder
  const {
    data: assignedIncidentsData,
    isLoading: isAssignedLoading,
  } = useAssignments({ status: 'assigned', limit: 20 });

  // Fetch in-progress accepted dispatches
  const {
    data: acceptedIncidentsData,
    isLoading: isAcceptedLoading,
  } = useAssignments({ status: 'accepted', limit: 20 });

  const assignedList = readList(assignedIncidentsData, 'assignments');
  const acceptedList = readList(acceptedIncidentsData, 'assignments');

  const activeCount = Number(dashboard?.activeIncidents ?? 0);
  const completedCount = Number(dashboard?.completedIncidents ?? 0);
  const unreadCount = Number(dashboard?.unreadNotifications ?? 0);

  const hasAnyActive = assignedList.length > 0 || acceptedList.length > 0;
  const isLoading = isDashLoading || isAssignedLoading || isAcceptedLoading;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title={`Hello, ${firstName}`}
        subtitle="Here are your active dispatches."
      />

      {/* 3 Soft Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Active Incidents */}
        <Card className="p-4 sm:p-5 flex items-center gap-3.5 bg-pastel-sky-bg/40 border-pastel-sky-text/20">
          <div className="p-2.5 rounded-xl bg-pastel-sky-bg text-pastel-sky-text shrink-0">
            <Siren className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <span className="block text-xl sm:text-2xl font-bold text-ink">
              {isDashLoading ? <Skeleton className="h-7 w-12" /> : activeCount}
            </span>
            <span className="text-xs font-medium text-ink-soft">Active Dispatches</span>
          </div>
        </Card>

        {/* Completed Incidents */}
        <Card className="p-4 sm:p-5 flex items-center gap-3.5 bg-pastel-mint-bg/40 border-pastel-mint-text/20">
          <div className="p-2.5 rounded-xl bg-pastel-mint-bg text-pastel-mint-text shrink-0">
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <span className="block text-xl sm:text-2xl font-bold text-ink">
              {isDashLoading ? <Skeleton className="h-7 w-12" /> : completedCount}
            </span>
            <span className="text-xs font-medium text-ink-soft">Completed Calls</span>
          </div>
        </Card>

        {/* Unread Notifications */}
        <Link
          to="/notifications"
          className="group block rounded-2xl border border-pastel-lavender-text/20 bg-pastel-lavender-bg/40 p-4 sm:p-5 shadow-soft transition-all hover:bg-pastel-lavender-bg/60"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-pastel-lavender-bg text-pastel-lavender-text shrink-0">
              <Bell className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="block text-xl sm:text-2xl font-bold text-ink">
                  {isDashLoading ? <Skeleton className="h-7 w-12" /> : unreadCount}
                </span>
                <ArrowRight className="w-4 h-4 text-pastel-lavender-text group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span className="text-xs font-medium text-ink-soft">Unread Notifications</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Content Area */}
      {isDashError ? (
        <ErrorState
          title="Could not load responder dashboard"
          message={dashError?.message || 'Failed to retrieve dispatch status.'}
          onRetry={refetchDashboard}
        />
      ) : isLoading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !hasAnyActive ? (
        <EmptyState
          icon={Shield}
          title="No active dispatches"
          text="You will be notified when an admin assigns an emergency to your unit."
          actionLabel="View assignment history"
          onAction={() => {}}
        />
      ) : (
        <div className="space-y-6">
          {/* Needs Your Response Section */}
          {assignedList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
                  <span>Needs your response</span>
                </h2>
                <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200/60">
                  {assignedList.length} new
                </span>
              </div>

              <div className="space-y-3">
                {assignedList.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    isHighlight={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* In Progress Section */}
          {acceptedList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                  In progress
                </h2>
                <span className="text-xs text-ink-faint">
                  {acceptedList.length} active
                </span>
              </div>

              <div className="space-y-3">
                {acceptedList.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    isHighlight={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResponderDashboardPage;
