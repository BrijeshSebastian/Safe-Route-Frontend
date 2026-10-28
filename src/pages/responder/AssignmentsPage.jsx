import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardList, RefreshCw } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Select from '../../components/ui/Select';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { SkeletonList } from '../../components/ui/Skeleton';
import Pagination from '../../components/ui/Pagination';
import AssignmentCard from '../../components/responder/AssignmentCard';
import { useAssignments } from '../../hooks/useResponder';
import { readList, readPagination } from '../../lib/pagination';
import { ASSIGNMENT_STATUSES, ASSIGNMENT_STATUS_LABELS, PAGE_SIZE_DEFAULT } from '../../lib/constants';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All assignments' },
  { value: ASSIGNMENT_STATUSES.ASSIGNED, label: `New (${ASSIGNMENT_STATUS_LABELS[ASSIGNMENT_STATUSES.ASSIGNED]})` },
  { value: ASSIGNMENT_STATUSES.ACCEPTED, label: ASSIGNMENT_STATUS_LABELS[ASSIGNMENT_STATUSES.ACCEPTED] },
  { value: ASSIGNMENT_STATUSES.REJECTED, label: ASSIGNMENT_STATUS_LABELS[ASSIGNMENT_STATUSES.REJECTED] },
  { value: ASSIGNMENT_STATUSES.COMPLETED, label: ASSIGNMENT_STATUS_LABELS[ASSIGNMENT_STATUSES.COMPLETED] },
];

export const AssignmentsPage = () => {
  useDocumentTitle('Active Assignments');
  const [searchParams, setSearchParams] = useSearchParams();

  const statusFilter = searchParams.get('status') || '';
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  const queryParams = {
    page: currentPage,
    size: PAGE_SIZE_DEFAULT,
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const { data, isLoading, isError, error, refetch, isFetching } = useAssignments(queryParams);

  const assignments = readList(data, 'assignments');
  const pagination = readPagination(data);

  const handleStatusChange = (e) => {
    const nextStatus = e.target.value;
    const nextParams = new URLSearchParams(searchParams);
    if (nextStatus) {
      nextParams.set('status', nextStatus);
    } else {
      nextParams.delete('status');
    }
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const handlePageChange = (newPage) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', String(newPage));
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="My assignments"
        subtitle="Manage current dispatch orders and track ongoing emergencies."
      />

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-card p-3 rounded-2xl border border-line shadow-soft">
        <div className="w-full sm:w-64">
          <Select
            id="assignment-status-filter"
            value={statusFilter}
            onChange={handleStatusChange}
            aria-label="Filter assignments by status"
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center justify-end gap-2 text-xs text-ink-faint">
          {isFetching && !isLoading && (
            <span className="flex items-center gap-1.5 text-primary-600">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Updating…</span>
            </span>
          )}
          <span>Auto-refreshes every 30s</span>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <SkeletonList count={3} />
      ) : isError ? (
        <ErrorState
          title="Could not load assignments"
          message={error?.message || 'Failed to retrieve your dispatch assignments.'}
          onRetry={refetch}
        />
      ) : assignments.length === 0 ? (
        statusFilter ? (
          <EmptyState
            icon={ClipboardList}
            title="No matching assignments"
            text={`No assignments found with status "${ASSIGNMENT_STATUS_LABELS[statusFilter] || statusFilter}".`}
            actionLabel="Clear status filter"
            onAction={() => {
              const nextParams = new URLSearchParams(searchParams);
              nextParams.delete('status');
              nextParams.set('page', '1');
              setSearchParams(nextParams);
            }}
          />
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="No assignments found"
            text="You have no current or recent assignments."
          />
        )
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                isHighlight={assignment.assignment_status === 'assigned'}
              />
            ))}
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;
