import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Camera } from 'lucide-react';
import StatusBadge from './StatusBadge';
import SeverityBadge from './SeverityBadge';
import TypeIcon from './TypeIcon';
import { timeAgo } from '../../lib/format';

export const IncidentCard = ({ incident, to = null, className = '' }) => {
  if (!incident) return null;

  const targetPath = to || `/reporter/incidents/${incident.id}`;
  const timestamp = incident.createdAt || incident.created_at;
  const photoCount = Array.isArray(incident.images) ? incident.images.length : 0;

  return (
    <Link
      to={targetPath}
      className={`block group rounded-2xl border border-line bg-surface-card p-4 sm:p-5 shadow-soft transition-all hover:border-primary-300 hover:shadow-md cursor-pointer ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <TypeIcon type={incident.incident_type} size="md" />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm sm:text-base text-ink truncate group-hover:text-primary-700 transition-colors">
              {incident.title}
            </h3>
            <p className="text-xs text-ink-faint mt-0.5">
              {timestamp ? timeAgo(timestamp) : 'Recently'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
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

      {photoCount > 0 && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-ink-faint">
          <Camera className="w-3.5 h-3.5" aria-hidden="true" />
          <span>
            {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
          </span>
        </div>
      )}
    </Link>
  );
};

export default IncidentCard;
