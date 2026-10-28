import { useState, useEffect } from 'react';

export const usePageVisible = () => {
  const [isVisible, setIsVisible] = useState(() => {
    return typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
};

export default usePageVisible;
