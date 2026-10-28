import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { History, MapPin, CheckCircle2, ExternalLink } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { SkeletonList } from '../../components/ui/Skeleton';
import Pagination from '../../components/ui/Pagination';
import TypeIcon from '../../components/incident/TypeIcon';
import SeverityBadge from '../../components/incident/SeverityBadge';
import StatusBadge from '../../components/incident/StatusBadge';
import { useCompletedAssignments } from '../../hooks/useResponder';
import { readList, readPagination } from '../../lib/pagination';
import { formatDateTime } from '../../lib/format';
import { googleMapsPinUrl } from '../../lib/maps';
import { toNumber, isValidCoord } from '../../lib/geo';
import { PAGE_SIZE_DEFAULT } from '../../lib/constants';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const HistoryPage = () => {
  useDocumentTitle('Response History');
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  const queryParams = {
    page: currentPage,
    size: PAGE_SIZE_DEFAULT,
  };

  const { data, isLoading, isError, error, refetch } = useCompletedAssignments(queryParams);

  const completedList = readList(data, 'assignments');
  const pagination = readPagination(data);

  const handlePageChange = (newPage) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', String(newPage));
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Assignment history"
        subtitle="Historical record of emergencies you responded to and resolved."
      />

      {isLoading ? (
        <SkeletonList count={3} />
      ) : isError ? (
        <ErrorState
          title="Could not load completed history"
          message={error?.message || 'Failed to retrieve completed dispatch history.'}
          onRetry={refetch}
        />
      ) : completedList.length === 0 ? (
        <EmptyState
          icon={History}
          title="No completed assignments"
          text="When you resolve emergency dispatches, they will appear here as part of your service record."
        />
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {completedList.map((assignment) => {
              const incident = assignment.incident || {};
              const lat = toNumber(incident.latitude);
              const lng = toNumber(incident.longitude);
              const hasCoords = lat !== null && lng !== null && isValidCoord(lat, lng);
              const completedTime = assignment.completed_at || assignment.updatedAt || assignment.updated_at;

              return (
                <div
                  key={assignment.id}
                  className="rounded-2xl border border-line bg-surface-card p-4 sm:p-5 shadow-soft transition-all hover:border-primary-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <TypeIcon type={incident.incident_type} size="md" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm sm:text-base text-ink truncate">
                          {incident.title || 'Resolved Incident'}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-pastel-mint-text font-medium mt-1">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Resolved on {formatDateTime(completedTime)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start">
                      <SeverityBadge severity={incident.severity} size="sm" />
                      <StatusBadge status={incident.status || 'resolved'} size="sm" />
                    </div>
                  </div>

                  {incident.address && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-soft">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-ink-faint" aria-hidden="true" />
                      <span className="truncate">{incident.address}</span>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-line flex items-center justify-between gap-3 text-xs">
                    <div>
                      {hasCoords && (
                        <a
                          href={googleMapsPinUrl(lat, lng)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-ink-soft hover:text-ink font-medium"
                        >
                          <span>View on map</span>
                          <ExternalLink className="w-3 h-3 text-ink-faint" />
                        </a>
                      )}
                    </div>

                    <Link
                      to={`/responder/assignments/${assignment.id}`}
                      className="font-semibold text-primary-600 hover:text-primary-700"
                    >
                      View details &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
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

export default HistoryPage;
