import React from 'react';

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  }[size] || 'w-6 h-6 border-2';

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-solid border-current border-t-transparent text-primary-600 ${sizeClasses} ${className}`}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
