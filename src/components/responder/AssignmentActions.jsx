import React, { useState } from 'react';
import { Check, XCircle, Navigation, MapPinCheck, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Textarea from '../ui/Textarea';
import { formatDateTime } from '../../lib/format';

export const AssignmentActions = ({
  assignment,
  onAccept,
  onReject,
  onStartTravel,
  onArrived,
  onResolve,
  isLoading = false,
  className = '',
}) => {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  if (!assignment) return null;

  const assignmentStatus = assignment.assignment_status;
  const incidentStatus = assignment.incident?.status;

  const handleConfirmReject = async () => {
    try {
      setSubmittingAction(true);
      const trimmedNotes = rejectNotes.trim();
      await onReject?.(trimmedNotes || undefined);
      setRejectModalOpen(false);
      setRejectNotes('');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleConfirmResolve = async () => {
    try {
      setSubmittingAction(true);
      const trimmedNotes = resolveNotes.trim();
      await onResolve?.(trimmedNotes || undefined);
      setResolveModalOpen(false);
      setResolveNotes('');
    } finally {
      setSubmittingAction(false);
    }
  };

  // State 6: Rejected assignment
  if (assignmentStatus === 'rejected') {
    return (
      <div
        role="status"
        className={`rounded-2xl bg-pastel-slate-bg text-pastel-slate-text border border-pastel-slate-text/20 p-4 flex items-center gap-3 text-xs sm:text-sm font-medium ${className}`}
      >
        <XCircle className="w-5 h-5 text-pastel-slate-text shrink-0" aria-hidden="true" />
        <span>This assignment is no longer active</span>
      </div>
    );
  }

  // State 5: Completed / Resolved
  if (assignmentStatus === 'completed' || incidentStatus === 'resolved') {
    return (
      <div
        role="status"
        className={`rounded-2xl bg-pastel-mint-bg text-pastel-mint-text border border-pastel-mint-text/20 p-4 space-y-1 text-xs sm:text-sm ${className}`}
      >
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-pastel-mint-text shrink-0" aria-hidden="true" />
          <span>Emergency Resolved</span>
        </div>
        <p className="text-xs text-pastel-mint-text/90 pl-6">
          Completed {formatDateTime(assignment.completed_at || assignment.updatedAt || assignment.updated_at)}
        </p>
      </div>
    );
  }

  // State 1: Assigned (Waiting response)
  const isPendingAssignment = assignmentStatus === 'assigned' && incidentStatus === 'assigned';

  // State 2: Accepted -> Ready to travel
  const isReadyToTravel = assignmentStatus === 'accepted' && incidentStatus === 'accepted';

  // State 3: Traveling -> Ready to arrive
  const isEnRoute = assignmentStatus === 'accepted' && incidentStatus === 'on_the_way';

  // State 4: Arrived -> Ready to resolve
  const isArrived = assignmentStatus === 'accepted' && incidentStatus === 'reached';

  const busy = isLoading || submittingAction;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* State 1: Accept / Reject */}
      {isPendingAssignment && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full">
          <Button
            type="button"
            variant="primary"
            size="lg"
            icon={Check}
            loading={busy}
            disabled={busy}
            onClick={() => onAccept?.()}
            className="flex-1"
          >
            Accept
          </Button>

          <Button
            type="button"
            variant="danger"
            size="lg"
            icon={XCircle}
            disabled={busy}
            onClick={() => setRejectModalOpen(true)}
            className="sm:w-auto"
          >
            Reject
          </Button>
        </div>
      )}

      {/* State 2: Start travel */}
      {isReadyToTravel && (
        <Button
          type="button"
          variant="primary"
          size="lg"
          icon={Navigation}
          loading={busy}
          disabled={busy}
          onClick={() => onStartTravel?.()}
          className="w-full"
        >
          Start travel
        </Button>
      )}

      {/* State 3: Arrived */}
      {isEnRoute && (
        <Button
          type="button"
          variant="primary"
          size="lg"
          icon={MapPinCheck}
          loading={busy}
          disabled={busy}
          onClick={() => onArrived?.()}
          className="w-full"
        >
          I have arrived
        </Button>
      )}

      {/* State 4: Resolve */}
      {isArrived && (
        <Button
          type="button"
          variant="primary"
          size="lg"
          icon={ShieldCheck}
          loading={busy}
          disabled={busy}
          onClick={() => setResolveModalOpen(true)}
          className="w-full"
        >
          Mark as resolved
        </Button>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => (busy ? null : setRejectModalOpen(false))}
        title="Reject dispatch assignment"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
            Are you sure you want to decline this dispatch? The incident will revert to verified status so another responder can be assigned.
          </p>

          <div className="space-y-1.5">
            <label htmlFor="reject-notes" className="block text-xs font-semibold text-ink-soft">
              Reason (optional)
            </label>
            <Textarea
              id="reject-notes"
              rows={3}
              placeholder="e.g. Mechanical issue, currently handling another call, out of area"
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              disabled={busy}
              maxLength={5000}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line sticky bottom-0 bg-surface-card py-2 -mb-1 z-10">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRejectModalOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={busy}
              onClick={handleConfirmReject}
            >
              Confirm rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Resolve Modal */}
      <Modal
        isOpen={resolveModalOpen}
        onClose={() => (busy ? null : setResolveModalOpen(false))}
        title="Mark incident as resolved"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
            Confirm that the emergency has been resolved and no further action is required at the location.
          </p>

          <div className="space-y-1.5">
            <label htmlFor="resolve-notes" className="block text-xs font-semibold text-ink-soft">
              Resolution notes (optional)
            </label>
            <Textarea
              id="resolve-notes"
              rows={3}
              placeholder="e.g. Fire extinguished, patient stabilized and transported, site secured"
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              disabled={busy}
              maxLength={5000}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line sticky bottom-0 bg-surface-card py-2 -mb-1 z-10">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setResolveModalOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={busy}
              onClick={handleConfirmResolve}
            >
              Confirm resolution
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssignmentActions;
