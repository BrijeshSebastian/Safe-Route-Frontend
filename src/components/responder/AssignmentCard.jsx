import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, Clock, Compass } from 'lucide-react';
import TypeIcon from '../incident/TypeIcon';
import StatusBadge from '../incident/StatusBadge';
import SeverityBadge from '../incident/SeverityBadge';
import { timeAgo, formatDistanceKm } from '../../lib/format';
import { googleMapsDirectionsUrl } from '../../lib/maps';
import { isValidCoord, toNumber, haversineDistanceKm } from '../../lib/geo';
import { useLocationSharing } from '../../hooks/useLocationSharing';

export const AssignmentCard = ({
  assignment,
  isHighlight = false,
  className = '',
}) => {
  const { lastPosition } = useLocationSharing();

  if (!assignment) return null;

  const incident = assignment.incident || {};
  const lat = toNumber(incident.latitude);
  const lng = toNumber(incident.longitude);
  const hasCoords = lat !== null && lng !== null && isValidCoord(lat, lng);

  const assignedAt = assignment.createdAt || assignment.created_at;
  const isAssignedOrAccepted = ['assigned', 'accepted'].includes(assignment.assignment_status);

  // Compute distance from responder's current position
  let distanceText = null;
  if (hasCoords && lastPosition?.latitude && lastPosition?.longitude) {
    const dist = haversineDistanceKm(
      lastPosition.latitude,
      lastPosition.longitude,
      lat,
      lng
    );
    if (dist !== null) {
      distanceText = formatDistanceKm(dist);
    }
  }

  const mapsUrl = hasCoords ? googleMapsDirectionsUrl(lat, lng) : '';

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-soft bg-surface-card ${
        isHighlight
          ? 'border-primary-300 bg-primary-50/20 shadow-md ring-1 ring-primary-400/20'
          : 'border-line hover:border-primary-200'
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <TypeIcon type={incident.incident_type} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm sm:text-base text-ink truncate">
                {incident.title || 'Untitled Emergency'}
              </h3>
              {isHighlight && (
                <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-800 uppercase tracking-wide">
                  New dispatch
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-faint mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Assigned {assignedAt ? timeAgo(assignedAt) : 'recently'}
              </span>

              {distanceText && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-primary-700 font-medium">
                    <Compass className="w-3.5 h-3.5" />
                    {distanceText} away
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start">
          <SeverityBadge severity={incident.severity} size="sm" />
          <StatusBadge status={incident.status} size="sm" />
        </div>
      </div>

      {incident.address && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-soft">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-ink-faint" aria-hidden="true" />
          <span className="truncate">{incident.address}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-line flex flex-wrap items-center justify-between gap-2.5">
        <div>
          {isAssignedOrAccepted && hasCoords && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200/60 text-xs font-semibold transition-colors shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5 text-primary-600" />
              <span>Open in Google Maps</span>
            </a>
          )}
        </div>

        <Link
          to={`/responder/assignments/${assignment.id}`}
          className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl border border-line bg-surface-card hover:bg-surface-muted text-xs font-semibold text-ink transition-colors shadow-xs"
        >
          View details
        </Link>
      </div>
    </div>
  );
};

export default AssignmentCard;
