import React from 'react';
import Badge from '../ui/Badge';
import { STATUS_COLORS, INCIDENT_STATUS_LABELS } from '../../lib/constants';

export const StatusBadge = ({ status, size = 'md', className = '' }) => {
  const variant = STATUS_COLORS[status] || 'slate';
  const label = INCIDENT_STATUS_LABELS[status] || status || 'Unknown';

  return (
    <Badge variant={variant} size={size} className={className}>
      {label}
    </Badge>
  );
};

export default StatusBadge;
