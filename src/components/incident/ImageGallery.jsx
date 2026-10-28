import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SecureImage from './SecureImage';
import Modal from '../ui/Modal';
import IconButton from '../ui/IconButton';

export const ImageGallery = ({ images = [], className = '' }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const imageList = Array.isArray(images)
    ? images.map((img) => (typeof img === 'string' ? img : img.image_url)).filter(Boolean)
    : [];

  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : imageList.length - 1));
  }, [imageList.length]);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev < imageList.length - 1 ? prev + 1 : 0));
  }, [imageList.length]);

  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, handlePrev, handleNext]);

  if (imageList.length === 0) {
    return (
      <div className={`text-xs text-ink-faint italic py-3 ${className}`}>
        No photos attached.
      </div>
    );
  }

  const currentUrl = selectedIndex !== null ? imageList[selectedIndex] : null;

  return (
    <div className={className}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {imageList.map((url, index) => (
          <button
            key={url + index}
            type="button"
            onClick={() => setSelectedIndex(index)}
            aria-label={`View photo ${index + 1}`}
            className="group relative aspect-square w-full overflow-hidden rounded-xl border border-line bg-surface-muted transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 cursor-pointer"
          >
            <SecureImage
              imageUrl={url}
              alt={`Incident attachment ${index + 1}`}
              className="w-full h-full object-cover transition-opacity group-hover:opacity-90"
            />
          </button>
        ))}
      </div>

      <Modal
        isOpen={selectedIndex !== null}
        onClose={() => setSelectedIndex(null)}
        title={`Photo ${selectedIndex !== null ? selectedIndex + 1 : 0} of ${imageList.length}`}
        maxWidth="max-w-3xl"
      >
        {currentUrl && (
          <div className="relative flex flex-col items-center justify-center">
            <div className="relative max-h-[70vh] w-full rounded-xl overflow-hidden bg-surface-muted flex items-center justify-center p-1">
              <SecureImage
                imageUrl={currentUrl}
                alt={`Photo ${selectedIndex + 1}`}
                className="max-h-[68vh] w-auto max-w-full object-contain rounded-lg"
              />

              {imageList.length > 1 && (
                <>
                  <div className="absolute left-2 top-1/2 -translate-y-1/2">
                    <IconButton
                      icon={ChevronLeft}
                      aria-label="Previous photo"
                      variant="secondary"
                      size="sm"
                      className="shadow-soft bg-surface-card/90 backdrop-blur-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrev();
                      }}
                    />
                  </div>

                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <IconButton
                      icon={ChevronRight}
                      aria-label="Next photo"
                      variant="secondary"
                      size="sm"
                      className="shadow-soft bg-surface-card/90 backdrop-blur-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNext();
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ImageGallery;
