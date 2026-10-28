import React from 'react';
import { ImageOff } from 'lucide-react';
import { useSecureImage } from '../../hooks/useSecureImage';
import Skeleton from '../ui/Skeleton';

export const SecureImage = ({
  imageUrl,
  alt = 'Image',
  className = '',
  imgClassName = '',
  skeletonClassName = 'w-full h-full',
  fallbackText = 'Unavailable',
  ...props
}) => {
  const { src, isLoading, isError } = useSecureImage(imageUrl);

  if (isLoading) {
    return <Skeleton className={`${skeletonClassName} ${className}`} />;
  }

  if (isError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-surface-muted text-ink-faint rounded-xl p-2 text-xs text-center border border-line ${className}`}
        aria-label="Image unavailable"
      >
        <ImageOff className="w-5 h-5 mb-1 opacity-60" aria-hidden="true" />
        {fallbackText && <span className="text-[11px] font-medium">{fallbackText}</span>}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover ${imgClassName} ${className}`}
      {...props}
    />
  );
};

export default SecureImage;
