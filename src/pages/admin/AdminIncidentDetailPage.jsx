import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  XCircle,
  Phone,
  Mail,
  ExternalLink,
  UserCheck,
  ShieldCheck,
  RotateCcw,
  Ban,
  Radio,
} from 'lucide-react';

import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import TypeIcon from '../../components/incident/TypeIcon';
import StatusBadge from '../../components/incident/StatusBadge';
import SeverityBadge from '../../components/incident/SeverityBadge';
import StatusProgress from '../../components/incident/StatusProgress';
import StatusTimeline from '../../components/incident/StatusTimeline';
import ImageGallery from '../../components/incident/ImageGallery';
import IncidentMap from '../../components/map/IncidentMap';
import ResponderLiveMap from '../../components/map/ResponderLiveMap';
import AssignResponderModal from '../../components/admin/AssignResponderModal';

import {
  useAdminIncident,
  useVerifyIncident,
  useRejectIncident,
  useCancelAssignment,
} from '../../hooks/useAdmin';
import { useIncidentHistory } from '../../hooks/useIncidents';
import { googleMapsPinUrl } from '../../lib/maps';
import { formatDateTime } from '../../lib/format';
import {
  INCIDENT_STATUSES,
  INCIDENT_TYPE_LABELS,
  RESPONDER_TYPE_LABELS,
  ASSIGNMENT_STATUS_LABELS,
  TERMINAL_STATUSES,
} from '../../lib/constants';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const AdminIncidentDetailPage = () => {
  useDocumentTitle('Incident Management');
  const { id } = useParams();
  const numericId = parseInt(id, 10);

  // Fetch Incident (polls 30s while not terminal)
  const {
    data: incidentData,
    isLoading: isLoadingIncident,
    isError: isIncidentError,
    refetch: refetchIncident,
  } = useAdminIncident(numericId);

  // Fetch Status History
  const { data: historyData } = useIncidentHistory(numericId);

  const incident = incidentData?.data?.incident || incidentData?.incident;
  const history = historyData?.data?.history || historyData?.history || [];

  // Modals state
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignMode, setAssignMode] = useState('assign'); // 'assign' | 'reassign'

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Mutations
  const verifyMutation = useVerifyIncident();
  const rejectMutation = useRejectIncident();
  const cancelMutation = useCancelAssignment();

  // Find active assignment if any
  const assignments = useMemo(() => {
    return Array.isArray(incident?.assignments) ? incident.assignments : [];
  }, [incident]);

  const activeAssignment = useMemo(() => {
    return assignments.find((a) =>
      ['assigned', 'accepted'].includes(a.assignment_status)
    );
  }, [assignments]);

  // Handlers
  const handleVerify = async () => {
    await verifyMutation.mutateAsync(numericId);
    setVerifyDialogOpen(false);
  };

  const handleOpenReject = () => {
    setRejectReason('');
    setRejectError('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    const trimmed = rejectReason.trim();
    if (trimmed.length > 0 && trimmed.length < 5) {
      setRejectError('Reason must be at least 5 characters if provided.');
      return;
    }
    setRejectError('');
    await rejectMutation.mutateAsync({
      id: numericId,
      reason: trimmed || undefined,
    });
    setRejectModalOpen(false);
  };

  const handleOpenAssign = (mode = 'assign') => {
    setAssignMode(mode);
    setAssignModalOpen(true);
  };

  const handleCancelAssignment = async () => {
    if (!activeAssignment) return;
    await cancelMutation.mutateAsync({
      assignmentId: activeAssignment.id,
      incidentId: numericId,
    });
    setCancelDialogOpen(false);
  };

  if (isLoadingIncident) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isIncidentError || !incident) {
    return (
      <ErrorState
        title="Incident not found"
        description="Could not load the requested emergency incident details."
        onRetry={refetchIncident}
      />
    );
  }

  const status = incident.status;
  const isPending = status === INCIDENT_STATUSES.PENDING;
  const isVerified = status === INCIDENT_STATUSES.VERIFIED;
  const isAssignedOrAccepted =
    status === INCIDENT_STATUSES.ASSIGNED || status === INCIDENT_STATUSES.ACCEPTED;
  const isEnRouteOrReached =
    status === INCIDENT_STATUSES.ON_THE_WAY || status === INCIDENT_STATUSES.REACHED;
  const isTerminal = TERMINAL_STATUSES.includes(status);

  // Should we show live responder tracking map?
  const showLiveMap =
    status === INCIDENT_STATUSES.ACCEPTED ||
    status === INCIDENT_STATUSES.ON_THE_WAY ||
    status === INCIDENT_STATUSES.REACHED;

  const gmapsUrl = googleMapsPinUrl(incident.latitude, incident.longitude);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={
          <div className="flex items-center gap-3 flex-wrap">
            <TypeIcon type={incident.incident_type} size="md" />
            <span>#{incident.id} · {incident.title}</span>
          </div>
        }
        subtitle={
          <div className="flex items-center gap-2 flex-wrap text-xs text-ink-muted mt-1">
            <span>Reported {formatDateTime(incident.createdAt || incident.created_at)}</span>
            <span>·</span>
            <span>{INCIDENT_TYPE_LABELS[incident.incident_type] || incident.incident_type}</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityBadge severity={incident.severity} size="md" />
            <StatusBadge status={incident.status} size="md" />
          </div>
        }
      />

      {/* Status Progress Bar */}
      <Card className="p-4 sm:p-5">
        <StatusProgress status={incident.status} />
      </Card>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Details, Map, Reporter, Assignments, Timeline */}
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
          {/* Map Display */}
          <Card
            title={showLiveMap ? 'Live Responder Tracking Map' : 'Incident Location Map'}
            subtitle={
              incident.address
                ? incident.address
                : `Coordinates: ${incident.latitude}, ${incident.longitude}`
            }
            action={
              gmapsUrl && (
                <a
                  href={gmapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )
            }
          >
            <div className="h-64 sm:h-72 w-full rounded-xl overflow-hidden border border-line">
              {showLiveMap ? (
                <ResponderLiveMap incidentId={incident.id} incident={incident} className="h-full" />
              ) : (
                <IncidentMap incident={incident} className="h-full" />
              )}
            </div>
          </Card>

          {/* Description & Attached Media */}
          <Card title="Incident Details">
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
                  Report Description
                </h4>
                <p className="text-ink leading-relaxed whitespace-pre-wrap bg-surface-page p-3.5 rounded-xl border border-line/60">
                  {incident.description}
                </p>
              </div>

              {/* Photos Gallery */}
              <div>
                <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                  Evidence Photos ({incident.images?.length || 0})
                </h4>
                <ImageGallery images={incident.images || []} />
              </div>
            </div>
          </Card>

          {/* Reporter Card (Admin sees full details) */}
          <Card title="Reporter Contact Information" subtitle="Full contact profile from account record">
            {incident.reporter ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-ink-muted block text-xs">Full Name</span>
                  <span className="font-semibold text-ink text-sm block mt-0.5">
                    {incident.reporter.full_name}
                  </span>
                </div>

                <div>
                  <span className="text-ink-muted block text-xs">Email Address</span>
                  {incident.reporter.email ? (
                    <a
                      href={`mailto:${incident.reporter.email}`}
                      className="font-semibold text-primary-600 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{incident.reporter.email}</span>
                    </a>
                  ) : (
                    <span className="text-ink-muted">—</span>
                  )}
                </div>

                <div>
                  <span className="text-ink-muted block text-xs">Phone Number</span>
                  {incident.reporter.phone ? (
                    <a
                      href={`tel:${incident.reporter.phone}`}
                      className="font-semibold text-primary-600 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>{incident.reporter.phone}</span>
                    </a>
                  ) : (
                    <span className="text-ink-muted">—</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-ink-muted">Reporter details unavailable.</p>
            )}
          </Card>

          {/* Assignments Log */}
          <Card
            title="Dispatch & Assignment Records"
            subtitle="History of responder assignments, acceptances, and reassignments"
          >
            {assignments.length === 0 ? (
              <p className="text-xs text-ink-muted italic py-3">No responders dispatched yet.</p>
            ) : (
              <div className="divide-y divide-line -my-2">
                {assignments.map((assignment) => {
                  const responder = assignment.responder;
                  const isCurrent = ['assigned', 'accepted'].includes(assignment.assignment_status);
                  return (
                    <div
                      key={assignment.id}
                      className={`py-3 space-y-1.5 text-xs sm:text-sm ${
                        isCurrent ? 'bg-primary-50/40 -mx-3 px-3 rounded-xl' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-primary-600" />
                          <span className="font-semibold text-ink">
                            {responder?.full_name || `Responder #${assignment.responder_id}`}
                          </span>
                          {responder?.responder_type && (
                            <Badge variant="lavender" size="sm">
                              {RESPONDER_TYPE_LABELS[responder.responder_type] ||
                                responder.responder_type}
                            </Badge>
                          )}
                        </div>

                        <Badge
                          variant={
                            assignment.assignment_status === 'completed'
                              ? 'mint'
                              : assignment.assignment_status === 'rejected'
                              ? 'rose'
                              : assignment.assignment_status === 'accepted'
                              ? 'sky'
                              : 'butter'
                          }
                          size="sm"
                        >
                          {ASSIGNMENT_STATUS_LABELS[assignment.assignment_status] ||
                            assignment.assignment_status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-ink-muted flex-wrap">
                        {responder?.phone && (
                          <a
                            href={`tel:${responder.phone}`}
                            className="hover:text-primary-600 inline-flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{responder.phone}</span>
                          </a>
                        )}
                        <span>
                          Assigned {formatDateTime(assignment.createdAt || assignment.created_at)}
                        </span>
                        {assignment.completed_at && (
                          <span>Completed {formatDateTime(assignment.completed_at)}</span>
                        )}
                      </div>

                      {assignment.notes && (
                        <p className="text-xs text-ink-soft bg-surface-page p-2 rounded-lg border border-line/60">
                          <span className="font-semibold">Notes:</span> {assignment.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Status Timeline History */}
          <Card title="Activity & Status History" subtitle="Audit log of state transitions">
            <StatusTimeline history={history} />
          </Card>
        </div>

        {/* Right Column (1 col): Administrative Action Panel (Stacks first on mobile) */}
        <div className="space-y-6 order-1 lg:order-2">
          <Card title="Admin Dispatch Panel" subtitle="Incident triage & emergency controls">
            <div className="space-y-4">
              {/* Current Status Pill */}
              <div className="p-3 bg-surface-page rounded-xl border border-line flex items-center justify-between">
                <span className="text-xs text-ink-muted">Lifecycle State:</span>
                <StatusBadge status={incident.status} />
              </div>

              {/* State 1: PENDING -> Verify or Reject */}
              {isPending && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-ink-muted leading-relaxed">
                    This emergency report was submitted by a citizen and requires verification before
                    dispatching emergency units.
                  </p>

                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    icon={ShieldCheck}
                    onClick={() => setVerifyDialogOpen(true)}
                    className="w-full"
                  >
                    Verify Emergency
                  </Button>

                  <Button
                    type="button"
                    variant="danger"
                    size="md"
                    icon={XCircle}
                    onClick={handleOpenReject}
                    className="w-full"
                  >
                    Reject Report
                  </Button>
                </div>
              )}

              {/* State 2: VERIFIED -> Assign Responder */}
              {isVerified && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Report is verified as an active emergency. Select and assign a suitable response
                    unit (Ambulance, Police, or Fire Rescue).
                  </p>

                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    icon={UserCheck}
                    onClick={() => handleOpenAssign('assign')}
                    className="w-full"
                  >
                    Assign Responder
                  </Button>
                </div>
              )}

              {/* State 3: ASSIGNED or ACCEPTED -> Reassign or Cancel Assignment */}
              {isAssignedOrAccepted && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-ink-muted leading-relaxed">
                    A response unit is dispatched. You can reassign to a closer unit or cancel the
                    assignment to return the incident to the verified queue.
                  </p>

                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    icon={RotateCcw}
                    onClick={() => handleOpenAssign('reassign')}
                    className="w-full"
                  >
                    Reassign Responder
                  </Button>

                  {activeAssignment && (
                    <Button
                      type="button"
                      variant="danger"
                      size="md"
                      icon={Ban}
                      onClick={() => setCancelDialogOpen(true)}
                      className="w-full"
                    >
                      Cancel Assignment
                    </Button>
                  )}
                </div>
              )}

              {/* State 4: ON THE WAY or REACHED -> Informational note */}
              {isEnRouteOrReached && (
                <div className="p-4 bg-pastel-sky-bg text-pastel-sky-text rounded-2xl border border-pastel-sky-text/20 space-y-1.5 text-xs leading-relaxed">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Radio className="w-4 h-4 text-pastel-sky-text animate-pulse" />
                    <span>Responder In Operation</span>
                  </div>
                  <p className="text-xs text-pastel-sky-text/90">
                    The responder is actively traveling to or on-site at this emergency.
                    Reassignments and cancellations are disabled until the emergency is resolved.
                  </p>
                </div>
              )}

              {/* State 5: Terminal States */}
              {isTerminal && (
                <div className="p-4 bg-surface-page rounded-2xl border border-line text-xs text-ink-muted text-center space-y-1">
                  <p className="font-semibold text-ink text-sm capitalize">{incident.status}</p>
                  <p>This incident is in a terminal state and no further actions are permitted.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Verify Confirmation Dialog */}
      <ConfirmDialog
        isOpen={verifyDialogOpen}
        onClose={() => setVerifyDialogOpen(false)}
        title="Verify this emergency report?"
        message="This verifies the incident as an authentic emergency and advances it to the dispatch queue so response units can be assigned."
        confirmLabel="Verify Report"
        tone="primary"
        onConfirm={handleVerify}
      />

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Emergency Report"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Rejecting this report will mark it inactive and notify the reporter. You may optionally
            provide a reason explaining why the report was rejected.
          </p>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
              Reason (optional, at least 5 characters)
            </label>
            <Textarea
              rows={3}
              placeholder="e.g. Duplicate report, insufficient details, or false alarm…"
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (rejectError) setRejectError('');
              }}
              hasError={Boolean(rejectError)}
            />
            {rejectError && <p className="text-xs text-rose-600 font-medium">{rejectError}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line sticky bottom-0 bg-surface-card py-2 -mb-1 z-10">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRejectModalOpen(false)}
              disabled={rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmReject}
              loading={rejectMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign / Reassign Modal */}
      <AssignResponderModal
        incident={incident}
        mode={assignMode}
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onDone={() => {
          refetchIncident();
        }}
      />

      {/* Cancel Assignment Confirm Dialog */}
      <ConfirmDialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        title="Cancel active assignment?"
        message="The incident will go back to Verified so it can be dispatched again to a different responder."
        confirmLabel="Confirm Cancellation"
        tone="danger"
        onConfirm={handleCancelAssignment}
      />
    </div>
  );
};

export default AdminIncidentDetailPage;
