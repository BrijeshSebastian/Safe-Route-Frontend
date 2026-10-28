import React, { useState, useEffect } from 'react';
import { Radio, AlertCircle, X, HelpCircle } from 'lucide-react';
import { useLocationSharing } from '../../hooks/useLocationSharing';
import { timeAgo } from '../../lib/format';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const DISMISS_HINT_KEY = 'saferoute_location_hint_dismissed';

export const LocationStatusChip = ({ className = '' }) => {
  const { active, permission, lastSentAt, sendNow } = useLocationSharing();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHintDismissed, setIsHintDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_HINT_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [timeAgoText, setTimeAgoText] = useState(() =>
    lastSentAt ? timeAgo(lastSentAt) : 'just now'
  );

  // Update timeAgo every 5 seconds
  useEffect(() => {
    if (!lastSentAt) return;
    const interval = setInterval(() => {
      setTimeAgoText(timeAgo(lastSentAt));
    }, 5000);
    return () => clearInterval(interval);
  }, [lastSentAt]);

  const handleDismissHint = () => {
    setIsHintDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_HINT_KEY, 'true');
    } catch {
      // Ignore storage errors
    }
  };

  const handleUpdateNow = async () => {
    setIsUpdating(true);
    try {
      await sendNow();
    } finally {
      setIsUpdating(false);
    }
  };

  if (!active && permission !== 'denied') {
    return null;
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* 1. Status Chip */}
      {active && permission !== 'denied' ? (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pastel-mint-bg text-pastel-mint-text border border-pastel-mint-text/20 text-xs font-medium shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Sharing live location · last sent {timeAgoText}</span>
          <button
            type="button"
            onClick={handleUpdateNow}
            disabled={isUpdating}
            className="ml-1 text-[11px] font-semibold underline text-primary-700 hover:text-primary-800 disabled:opacity-50 cursor-pointer"
          >
            {isUpdating ? 'Updating…' : 'Update now'}
          </button>
        </div>
      ) : permission === 'denied' ? (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pastel-butter-bg text-pastel-butter-text border border-pastel-butter-text/20 text-xs font-medium shadow-xs">
          <AlertCircle className="w-3.5 h-3.5 text-pastel-butter-text shrink-0" />
          <span>Location is off. Allow location access to share your position.</span>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="ml-1 inline-flex items-center gap-1 text-[11px] font-semibold underline text-amber-800 hover:text-amber-900 cursor-pointer"
          >
            <HelpCircle className="w-3 h-3" />
            How to enable
          </button>
        </div>
      ) : null}

      {/* 2. One-Time Dismissible Hint */}
      {active && !isHintDismissed && (
        <div className="flex items-center justify-between gap-2 px-3 py-1 rounded-xl bg-surface-card border border-line text-[11px] text-ink-soft shadow-xs max-w-md">
          <div className="flex items-center gap-1.5 truncate">
            <Radio className="w-3 h-3 text-primary-600 shrink-0" />
            <span className="truncate">
              Keep this page open while you respond so your live location keeps updating.
            </span>
          </div>
          <button
            type="button"
            onClick={handleDismissHint}
            aria-label="Dismiss location hint"
            className="p-0.5 text-ink-faint hover:text-ink rounded transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Browser Location Permission Instructions Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Enabling Location Access"
        maxWidth="max-w-md"
      >
        <div className="space-y-3 text-xs sm:text-sm text-ink-soft leading-relaxed">
          <p>
            SafeRoute requires location access so dispatchers and citizens can track your approach in real time.
          </p>
          <div className="bg-surface-page p-3 rounded-xl border border-line space-y-2 text-xs">
            <div className="font-semibold text-ink">In Chrome / Edge / Brave:</div>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Click the lock or tune icon on the left of the address bar.</li>
              <li>Toggle <strong>Location</strong> to <strong>Allow</strong>.</li>
              <li>Refresh the page.</li>
            </ol>
            <div className="font-semibold text-ink pt-1">In Safari (iOS / Mac):</div>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Tap the <span className="font-mono">aA</span> or settings icon on the address bar.</li>
              <li>Select <strong>Website Settings</strong> &rarr; <strong>Location</strong> &rarr; <strong>Allow</strong>.</li>
            </ol>
          </div>
          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
              Got it
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LocationStatusChip;
