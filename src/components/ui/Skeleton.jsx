import React from 'react';

export const Skeleton = ({ className = '', rounded = 'rounded-xl', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-surface-muted ${rounded} ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
};

export const SkeletonCard = ({ className = '' }) => {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface-card p-4 md:p-6 shadow-soft space-y-4 ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="pt-2 flex items-center justify-between border-t border-line">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20 rounded-xl" />
      </div>
    </div>
  );
};

export const SkeletonList = ({ count = 3, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export default Skeleton;
