import React from 'react';
import IncidentMap from './IncidentMap';
import { useResponderLocation } from '../../hooks/useIncidents';
import { timeAgo } from '../../lib/format';
import { AlertCircle, Clock } from 'lucide-react';

export const ResponderLiveMap = ({
  incidentId,
  incident,
  enabled = true,
  className = '',
}) => {
  const { data: location, isError, error } = useResponderLocation(incidentId, enabled);

  // If 404 (endpoint not supported or assignment not found), render nothing
  if (isError && error?.response?.status === 404) {
    return null;
  }

  if (!enabled) {
    return <IncidentMap incident={incident} className={className} />;
  }

  const hasLocation = Boolean(location && location.latitude != null && location.longitude != null);
  const isStale = Boolean(
    location?.updated_at && Date.now() - new Date(location.updated_at).getTime() > 120000
  );

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink">Live Responder Tracking</span>
          {hasLocation && location.updated_at && (
            <span className="text-ink-faint flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Updated {timeAgo(location.updated_at)}
            </span>
          )}
        </div>

        {isStale && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-pastel-butter-text bg-pastel-butter-bg border border-pastel-butter-text/15 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" />
            Last update over 2 minutes ago
          </span>
        )}
      </div>

      <IncidentMap
        incident={incident}
        responder={hasLocation ? location : null}
      />

      {!hasLocation && (
        <p className="text-xs text-ink-faint italic text-center py-1">
          Waiting for the responder's live location…
        </p>
      )}
    </div>
  );
};

export default ResponderLiveMap;
