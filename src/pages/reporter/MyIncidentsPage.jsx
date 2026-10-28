import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Siren, RefreshCw } from 'lucide-react';

import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { SkeletonList } from '../../components/ui/Skeleton';
import Pagination from '../../components/ui/Pagination';
import IncidentCard from '../../components/incident/IncidentCard';
import { useMyIncidents } from '../../hooks/useIncidents';
import { readList, readPagination } from '../../lib/pagination';
import { INCIDENT_STATUSES, STATUS_LABELS, PAGE_SIZE_DEFAULT } from '../../lib/constants';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: INCIDENT_STATUSES.PENDING, label: STATUS_LABELS[INCIDENT_STATUSES.PENDING] },
  { value: INCIDENT_STATUSES.VERIFIED, label: STATUS_LABELS[INCIDENT_STATUSES.VERIFIED] },
  { value: INCIDENT_STATUSES.ASSIGNED, label: STATUS_LABELS[INCIDENT_STATUSES.ASSIGNED] },
  { value: INCIDENT_STATUSES.ACCEPTED, label: STATUS_LABELS[INCIDENT_STATUSES.ACCEPTED] },
  { value: INCIDENT_STATUSES.ON_THE_WAY, label: STATUS_LABELS[INCIDENT_STATUSES.ON_THE_WAY] },
  { value: INCIDENT_STATUSES.REACHED, label: STATUS_LABELS[INCIDENT_STATUSES.REACHED] },
  { value: INCIDENT_STATUSES.RESOLVED, label: STATUS_LABELS[INCIDENT_STATUSES.RESOLVED] },
  { value: INCIDENT_STATUSES.REJECTED, label: STATUS_LABELS[INCIDENT_STATUSES.REJECTED] },
  { value: INCIDENT_STATUSES.CANCELLED, label: STATUS_LABELS[INCIDENT_STATUSES.CANCELLED] },
];

export const MyIncidentsPage = () => {
  useDocumentTitle('My Incidents');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const statusFilter = searchParams.get('status') || '';
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  const queryParams = {
    page: currentPage,
    size: PAGE_SIZE_DEFAULT,
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const { data, isLoading, isError, error, refetch, isFetching } = useMyIncidents(queryParams);

  const incidents = readList(data, 'incidents');
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
        title="My incidents"
        subtitle="Track the status of emergencies you reported in real time."
        action={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate('/reporter/report')}
          >
            Report emergency
          </Button>
        }
      />

      {/* Filter and Status Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-card p-3 rounded-2xl border border-line shadow-soft">
        <div className="w-full sm:w-64">
          <Select
            id="status-filter"
            value={statusFilter}
            onChange={handleStatusChange}
            aria-label="Filter incidents by status"
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
          <span>Auto-refreshes every 45s</span>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <SkeletonList count={3} />
      ) : isError ? (
        <ErrorState
          title="Could not load your incidents"
          message={error?.message || 'Failed to retrieve your emergency reports.'}
          onRetry={refetch}
        />
      ) : incidents.length === 0 ? (
        statusFilter ? (
          <EmptyState
            icon={Siren}
            title="No matching reports"
            text={`No reports found with status "${STATUS_LABELS[statusFilter] || statusFilter}".`}
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
            icon={Siren}
            title="No reports yet"
            text="You have not submitted any emergency reports. If you see an emergency, report it immediately."
            actionLabel="Report an emergency"
            onAction={() => navigate('/reporter/report')}
          />
        )
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {incidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                to={`/reporter/incidents/${incident.id}`}
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

export default MyIncidentsPage;
