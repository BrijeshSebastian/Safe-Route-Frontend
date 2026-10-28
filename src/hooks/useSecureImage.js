import { useState, useEffect } from 'react';
import { filesApi } from '../api/files';

const MAX_CACHE_SIZE = 60;
const imageCache = new Map();

export const useSecureImage = (imageUrl) => {
  const cachedUrl = imageUrl ? imageCache.get(imageUrl) : null;
  const [fetchedSrc, setFetchedSrc] = useState(null);
  const [fetchUrl, setFetchUrl] = useState(imageUrl);
  const [isLoading, setIsLoading] = useState(Boolean(imageUrl && !cachedUrl));
  const [isError, setIsError] = useState(false);

  // Adjust state during render when imageUrl changes
  if (imageUrl !== fetchUrl) {
    setFetchUrl(imageUrl);
    setFetchedSrc(null);
    setIsLoading(Boolean(imageUrl && !imageCache.get(imageUrl)));
    setIsError(false);
  }

  const src = cachedUrl || (fetchUrl === imageUrl ? fetchedSrc : null);

  useEffect(() => {
    if (!imageUrl || imageCache.has(imageUrl)) {
      return;
    }

    let isCancelled = false;
    let tempUrl = null;

    filesApi
      .fetchImageBlob(imageUrl)
      .then((blob) => {
        if (isCancelled) return;
        const objectUrl = URL.createObjectURL(blob);
        tempUrl = objectUrl;

        // Manage cache size limit
        if (imageCache.size >= MAX_CACHE_SIZE) {
          const firstKey = imageCache.keys().next().value;
          const evictedUrl = imageCache.get(firstKey);
          if (evictedUrl) {
            URL.revokeObjectURL(evictedUrl);
          }
          imageCache.delete(firstKey);
        }

        imageCache.set(imageUrl, objectUrl);
        setFetchedSrc(objectUrl);
        setIsLoading(false);
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error('Failed to load secure image:', err);
        setIsError(true);
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
      // Revoke only if it was created and NOT cached
      if (tempUrl && !imageCache.has(imageUrl)) {
        URL.revokeObjectURL(tempUrl);
      }
    };
  }, [imageUrl]);

  return { src, isLoading, isError };
};

export default useSecureImage;
