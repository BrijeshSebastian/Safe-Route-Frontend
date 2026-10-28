import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Search, X, AlertTriangle, ExternalLink } from 'lucide-react';

import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Pagination from '../../components/ui/Pagination';
import TypeIcon from '../../components/incident/TypeIcon';
import StatusBadge from '../../components/incident/StatusBadge';
import SeverityBadge from '../../components/incident/SeverityBadge';

import { useAdminIncidents } from '../../hooks/useAdmin';
import { readPagination, readList } from '../../lib/pagination';
import { timeAgo } from '../../lib/format';
import {
  INCIDENT_STATUSES,
  STATUS_LABELS,
  INCIDENT_TYPES,
  INCIDENT_TYPE_LABELS,
  SEVERITIES,
  SEVERITY_LABELS,
} from '../../lib/constants';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const AdminIncidentsPage = () => {
  useDocumentTitle('Incident Triage');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read URL params
  const statusParam = searchParams.get('status') || '';
  const typeParam = searchParams.get('incident_type') || '';
  const severityParam = searchParams.get('severity') || '';
  const searchParam = searchParams.get('search') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  // Local state for debounced search
  const [searchInput, setSearchInput] = useState(searchParam);

  // Sync search input with searchParam if it changes externally
  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  // Debounce search input (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed !== searchParam) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            if (trimmed) {
              next.set('search', trimmed);
            } else {
              next.delete('search');
            }
            next.set('page', '1');
            return next;
          },
          { replace: true }
        );
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, searchParam, setSearchParams]);

  // Build query params for API
  const queryParams = useMemo(() => {
    const p = {
      page: pageParam,
      size: 10,
    };
    if (statusParam) p.status = statusParam;
    if (typeParam) p.incident_type = typeParam;
    if (severityParam) p.severity = severityParam;
    if (searchParam) p.search = searchParam;
    return p;
  }, [pageParam, statusParam, typeParam, severityParam, searchParam]);

  // Fetch admin incidents
  const { data, isLoading, isError, refetch } = useAdminIncidents(queryParams);

  const incidents = useMemo(() => readList(data), [data]);
  const pagination = useMemo(() => readPagination(data), [data]);

  // Filter change handlers
  const handleFilterChange = (key, value) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        next.set('page', '1');
        return next;
      },
      { replace: true }
    );
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams({}, { replace: true });
  };

  const handlePageChange = (newPage) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', String(newPage));
        return next;
      },
      { replace: false }
    );
  };

  const hasActiveFilters = Boolean(statusParam || typeParam || severityParam || searchParam);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incident Directory & Triage"
        subtitle="Full administrative oversight across all verified, active, and completed emergencies"
      />

      {/* Filter Bar */}
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          {/* Search Input */}
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1.5">
              Search Incident
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search title, description, or address…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
              <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1.5">
              Status
            </label>
            <Select
              value={statusParam}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              {Object.values(INCIDENT_STATUSES).map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status] || status}
                </option>
              ))}
            </Select>
          </div>

          {/* Incident Type Filter */}
          <div>
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1.5">
              Type
            </label>
            <Select
              value={typeParam}
              onChange={(e) => handleFilterChange('incident_type', e.target.value)}
              aria-label="Filter by incident type"
            >
              <option value="">All Types</option>
              {Object.values(INCIDENT_TYPES).map((type) => (
                <option key={type} value={type}>
                  {INCIDENT_TYPE_LABELS[type] || type}
                </option>
              ))}
            </Select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1.5">
              Severity
            </label>
            <Select
              value={severityParam}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
              aria-label="Filter by severity"
            >
              <option value="">All Severities</option>
              {Object.values(SEVERITIES).map((sev) => (
                <option key={sev} value={sev}>
                  {SEVERITY_LABELS[sev] || sev}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Filter Summary & Reset */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-line text-xs">
            <span className="text-ink-muted">Active filters applied</span>
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear filters</span>
            </button>
          </div>
        )}
      </Card>

      {/* Results Content */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load incidents"
          description="Failed to fetch incidents list from admin API."
          onRetry={refetch}
        />
      ) : incidents.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No incidents match your filters"
          description={
            hasActiveFilters
              ? 'Try widening your search terms or clearing status filters.'
              : 'There are currently no incidents in the platform directory.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                Clear all filters
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block bg-surface-card rounded-2xl border border-line shadow-xs overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-surface-page/60 border-b border-line text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  <th className="py-3 px-4">Incident</th>
                  <th className="py-3 px-4">Reporter</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reported</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {incidents.map((incident) => (
                  <tr
                    key={incident.id}
                    onClick={() => navigate(`/admin/incidents/${incident.id}`)}
                    className="hover:bg-surface-page/70 transition-colors cursor-pointer group"
                  >
                    {/* Incident Title & Type */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <TypeIcon type={incident.incident_type} size="sm" />
                        <div className="min-w-0 max-w-xs xl:max-w-md">
                          <span className="font-semibold text-ink group-hover:text-primary-600 block truncate">
                            #{incident.id} · {incident.title}
                          </span>
                          {incident.address && (
                            <span className="text-xs text-ink-muted truncate block">
                              {incident.address}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Reporter */}
                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-medium text-ink block">
                        {incident.reporter?.full_name || 'Anonymous'}
                      </span>
                      {incident.reporter?.email && (
                        <span className="text-ink-muted truncate block max-w-[160px]">
                          {incident.reporter.email}
                        </span>
                      )}
                    </td>

                    {/* Severity */}
                    <td className="py-3.5 px-4">
                      <SeverityBadge severity={incident.severity} size="sm" />
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={incident.status} size="sm" />
                    </td>

                    {/* Reported At */}
                    <td className="py-3.5 px-4 text-xs text-ink-muted whitespace-nowrap">
                      <span>{timeAgo(incident.createdAt || incident.created_at)}</span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        as={Link}
                        to={`/admin/incidents/${incident.id}`}
                        variant="secondary"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                        className="group-hover:bg-primary-50 group-hover:text-primary-700 group-hover:border-primary-200"
                      >
                        Open
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards (Visible on mobile only) */}
          <div className="md:hidden space-y-3">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                onClick={() => navigate(`/admin/incidents/${incident.id}`)}
                className="p-4 bg-surface-card rounded-2xl border border-line shadow-xs active:bg-surface-page transition-colors cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <TypeIcon type={incident.incident_type} size="sm" />
                    <div className="min-w-0">
                      <span className="font-semibold text-sm text-ink block truncate">
                        #{incident.id} · {incident.title}
                      </span>
                      <span className="text-xs text-ink-muted">
                        {timeAgo(incident.createdAt || incident.created_at)}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={incident.status} size="sm" />
                </div>

                {incident.address && (
                  <p className="text-xs text-ink-muted line-clamp-1">{incident.address}</p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-line text-xs">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={incident.severity} size="sm" />
                    <span className="text-ink-muted">
                      by {incident.reporter?.full_name || 'Anonymous'}
                    </span>
                  </div>

                  <span className="font-semibold text-primary-600 inline-flex items-center gap-1">
                    Open <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </div>
      )}
    </div>
  );
};

export default AdminIncidentsPage;
