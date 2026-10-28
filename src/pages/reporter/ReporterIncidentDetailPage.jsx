import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Ban,
  MapPin,
  Clock,
  Shield,
  AlertTriangle,
  Radio,
} from 'lucide-react';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ErrorState from '../../components/ui/ErrorState';
import Skeleton from '../../components/ui/Skeleton';
import TypeIcon from '../../components/incident/TypeIcon';
import StatusBadge from '../../components/incident/StatusBadge';
import SeverityBadge from '../../components/incident/SeverityBadge';
import StatusProgress from '../../components/incident/StatusProgress';
import StatusTimeline from '../../components/incident/StatusTimeline';
import ImageGallery from '../../components/incident/ImageGallery';
import IncidentMap from '../../components/map/IncidentMap';
import ResponderLiveMap from '../../components/map/ResponderLiveMap';

import {
  useIncident,
  useIncidentHistory,
  useCancelIncident,
  useDeleteIncident,
} from '../../hooks/useIncidents';
import {
  INCIDENT_STATUSES,
  INCIDENT_TYPE_LABELS,
  SEVERITY_LABELS,
  RESPONDER_TYPE_LABELS,
} from '../../lib/constants';
import { formatDateTime } from '../../lib/format';
import { getErrorMessage } from '../../lib/errors';
import { toNumber } from '../../lib/geo';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const RESPONDER_STATUS_MESSAGES = {
  [INCIDENT_STATUSES.ASSIGNED]: 'A responder has been assigned and will confirm shortly',
  [INCIDENT_STATUSES.ACCEPTED]: 'The responder accepted and is preparing',
  [INCIDENT_STATUSES.ON_THE_WAY]: 'Help is on the way',
  [INCIDENT_STATUSES.REACHED]: 'The responder has reached the location',
  [INCIDENT_STATUSES.RESOLVED]: 'This emergency was marked resolved',
};

export const ReporterIncidentDetailPage = () => {
  useDocumentTitle('Incident Details');
  const { id } = useParams();
  const navigate = useNavigate();

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    data: incidentData,
    isLoading: isIncidentLoading,
    isError: isIncidentError,
    error: incidentError,
    refetch: refetchIncident,
  } = useIncident(id);

  const incident = incidentData?.data?.incident || incidentData?.data || incidentData?.incident;

  const {
    data: historyData,
    isLoading: isHistoryLoading,
    refetch: refetchHistory,
  } = useIncidentHistory(id);

  const historyList = useMemo(() => {
    if (!historyData) return [];
    if (Array.isArray(historyData)) return historyData;
    if (Array.isArray(historyData.data?.history)) return historyData.data.history;
    if (Array.isArray(historyData.history)) return historyData.history;
    if (Array.isArray(historyData.data)) return historyData.data;
    return [];
  }, [historyData]);

  // Refetch history when polled status changes
  useEffect(() => {
    if (incident?.status) {
      refetchHistory();
    }
  }, [incident?.status, refetchHistory]);

  const cancelMutation = useCancelIncident();
  const deleteMutation = useDeleteIncident();

  if (isIncidentLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  if (isIncidentError || !incident) {
    const status = incidentError?.response?.status;
    const isUnavailable = status === 403 || status === 404;

    return (
      <div className="max-w-4xl mx-auto py-8">
        <ErrorState
          title={isUnavailable ? 'This incident is not available' : 'Failed to load incident'}
          message={
            isUnavailable
              ? 'You do not have permission to view this incident or it does not exist.'
              : getErrorMessage(incidentError)
          }
          onRetry={isUnavailable ? undefined : refetchIncident}
        />
        <div className="mt-4 text-center">
          <Link
            to="/reporter/incidents"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to my incidents
          </Link>
        </div>
      </div>
    );
  }

  const isPending = incident.status === INCIDENT_STATUSES.PENDING;
  const isVerified = incident.status === INCIDENT_STATUSES.VERIFIED;
  const isRejected = incident.status === INCIDENT_STATUSES.REJECTED;
  const canEdit = isPending;
  const canDelete = isPending;
  const canCancel = isPending || isVerified;

  // Active responder details
  const activeAssignment = Array.isArray(incident.assignments)
    ? incident.assignments.find((a) =>
        ['accepted', 'assigned', 'completed'].includes(a.assignment_status)
      ) || incident.assignments[incident.assignments.length - 1]
    : null;

  const responder = activeAssignment?.responder;
  const showResponderBlock =
    Boolean(activeAssignment) &&
    [
      INCIDENT_STATUSES.ASSIGNED,
      INCIDENT_STATUSES.ACCEPTED,
      INCIDENT_STATUSES.ON_THE_WAY,
      INCIDENT_STATUSES.REACHED,
      INCIDENT_STATUSES.RESOLVED,
    ].includes(incident.status);

  const isLiveTrackingActive = [
    INCIDENT_STATUSES.ACCEPTED,
    INCIDENT_STATUSES.ON_THE_WAY,
    INCIDENT_STATUSES.REACHED,
  ].includes(incident.status);

  // Find rejection reason from history if available
  const rejectionEntry = historyList.find(
    (h) => h.new_status === INCIDENT_STATUSES.REJECTED
  );
  const rejectionReason = rejectionEntry?.notes || null;

  const handleConfirmCancel = async () => {
    try {
      await cancelMutation.mutateAsync(id);
      toast.success('Incident cancelled successfully.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Incident deleted successfully.');
      navigate('/reporter/incidents');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const lat = toNumber(incident.latitude);
  const lng = toNumber(incident.longitude);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/reporter/incidents"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to my incidents
        </Link>

        {/* Dynamic Contextual Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <Button
              variant="secondary"
              size="sm"
              icon={Edit2}
              onClick={() => navigate(`/reporter/incidents/${id}/edit`)}
            >
              Edit report
            </Button>
          )}

          {canCancel && (
            <Button
              variant="secondary"
              size="sm"
              icon={Ban}
              onClick={() => setIsCancelDialogOpen(true)}
            >
              Cancel report
            </Button>
          )}

          {canDelete && (
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Delete report
            </Button>
          )}
        </div>
      </div>

      {/* Main Incident Header Card */}
      <Card className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <TypeIcon type={incident.incident_type} size="lg" />
            <div className="space-y-1">
              <h1 className="text-lg sm:text-xl font-bold text-ink leading-snug">
                {incident.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-faint">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Reported {formatDateTime(incident.createdAt || incident.created_at)}
                </span>
                {incident.address && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-ink-soft truncate max-w-sm">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {incident.address}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <SeverityBadge severity={incident.severity} size="md" />
            <StatusBadge status={incident.status} size="md" />
          </div>
        </div>

        {/* Status Stepper / Progress Bar */}
        <div className="pt-2 border-t border-line">
          <StatusProgress status={incident.status} reason={rejectionReason} />
        </div>

        {/* Rejection notice box if rejected */}
        {isRejected && (
          <div
            role="status"
            className="rounded-xl bg-pastel-rose-bg text-pastel-rose-text border border-pastel-rose-text/20 p-4 space-y-1.5"
          >
            <div className="flex items-center gap-2 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>This report was not accepted</span>
            </div>
            {rejectionReason && (
              <p className="text-xs text-pastel-rose-text/90 pl-6 leading-relaxed">
                <span className="font-medium">Reason from admin:</span> {rejectionReason}
              </p>
            )}
          </div>
        )}

        {/* Responder Information Block */}
        {showResponderBlock && (
          <div className="rounded-xl border border-line bg-surface-muted/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary-100 text-primary-700">
                <Shield className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs font-semibold text-ink">
                  Responder:{' '}
                  <span className="text-primary-700">
                    {responder?.full_name || 'Assigned Responder Unit'}
                  </span>
                  {responder?.responder_type && (
                    <span className="ml-1 text-ink-faint font-normal">
                      ({RESPONDER_TYPE_LABELS[responder.responder_type] || responder.responder_type})
                    </span>
                  )}
                </div>
                <div className="text-xs text-ink-soft mt-0.5" aria-live="polite">
                  {RESPONDER_STATUS_MESSAGES[incident.status] || 'Help is responding.'}
                </div>
              </div>
            </div>

            {isLiveTrackingActive && (
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-200">
                <Radio className="w-3.5 h-3.5 animate-pulse text-primary-600" />
                <span>Live tracking active</span>
              </div>
            )}
          </div>
        )}

        {/* Map View */}
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-ink-soft">Emergency Location</h2>
          {isLiveTrackingActive ? (
            <ResponderLiveMap
              incidentId={id}
              incident={incident}
              enabled={isLiveTrackingActive}
            />
          ) : (
            <IncidentMap incident={incident} />
          )}
        </div>

        {/* Details Section */}
        <div className="space-y-3 pt-3 border-t border-line">
          <h2 className="text-xs font-semibold text-ink-soft">Incident Details</h2>
          <div className="text-sm text-ink leading-relaxed whitespace-pre-line bg-surface-page p-4 rounded-xl border border-line/60">
            {incident.description}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl border border-line bg-surface-card">
              <span className="block text-[11px] font-semibold text-ink-faint uppercase tracking-wider">
                Category
              </span>
              <span className="text-xs font-semibold text-ink mt-0.5 block">
                {INCIDENT_TYPE_LABELS[incident.incident_type] || incident.incident_type}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-line bg-surface-card">
              <span className="block text-[11px] font-semibold text-ink-faint uppercase tracking-wider">
                Assessed Severity
              </span>
              <span className="text-xs font-semibold text-ink mt-0.5 block">
                {SEVERITY_LABELS[incident.severity] || incident.severity}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-line bg-surface-card">
              <span className="block text-[11px] font-semibold text-ink-faint uppercase tracking-wider">
                Address
              </span>
              <span className="text-xs text-ink mt-0.5 block">
                {incident.address || 'No specific address provided'}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-line bg-surface-card">
              <span className="block text-[11px] font-semibold text-ink-faint uppercase tracking-wider">
                Coordinates (GPS)
              </span>
              <span className="text-xs font-mono text-ink mt-0.5 block">
                {lat != null && lng != null ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Photos Image Gallery */}
        <div className="space-y-3 pt-3 border-t border-line">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-ink-soft">Attached Photos</h2>
            <span className="text-xs text-ink-faint">
              {incident.images?.length || 0} photos
            </span>
          </div>
          <ImageGallery images={incident.images || []} />
        </div>

        {/* Status History Timeline */}
        <div className="space-y-3 pt-3 border-t border-line">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-ink-soft">Status History</h2>
            {isHistoryLoading && (
              <span className="text-xs text-ink-faint">Loading history…</span>
            )}
          </div>
          <StatusTimeline history={historyList} />
        </div>
      </Card>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        title="Cancel emergency report"
        message="Are you sure you want to cancel this emergency report? Responders and dispatchers will be notified that help is no longer required."
        confirmLabel="Yes, cancel report"
        cancelLabel="Keep report"
        tone="danger"
        onConfirm={handleConfirmCancel}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title="Delete report"
        message="This will permanently delete your report and its photos. This action cannot be undone."
        confirmLabel="Delete permanently"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default ReporterIncidentDetailPage;
