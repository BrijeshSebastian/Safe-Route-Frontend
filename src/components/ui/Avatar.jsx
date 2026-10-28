import React from 'react';
import SecureImage from '../incident/SecureImage';

export const Avatar = ({
  src = null,
  name = '',
  size = 'md',
  className = '',
}) => {
  const getInitials = (n) => {
    if (!n) return '?';
    const parts = n.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  }[size] || 'w-10 h-10 text-sm';

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden select-none shrink-0 ${sizeClasses} ${className}`}
    >
      {src ? (
        <SecureImage
          imageUrl={src}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
          skeletonClassName="w-full h-full rounded-full"
          fallbackText=""
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-pastel-lavender-bg text-pastel-lavender-text font-semibold uppercase tracking-wider">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
};

export default Avatar;
