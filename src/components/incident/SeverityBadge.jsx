import React from 'react';
import Badge from '../ui/Badge';
import { SEVERITY_COLORS, SEVERITY_LABELS } from '../../lib/constants';

export const SeverityBadge = ({ severity, size = 'md', className = '' }) => {
  const variant = SEVERITY_COLORS[severity] || 'butter';
  const label = SEVERITY_LABELS[severity] || severity || 'Medium';

  return (
    <Badge variant={variant} size={size} className={className}>
      {label}
    </Badge>
  );
};

export default SeverityBadge;
