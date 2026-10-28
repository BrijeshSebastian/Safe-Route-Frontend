import { useEffect } from 'react';

export const useDocumentTitle = (title) => {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) {
      document.title = `${title} · SafeRoute`;
    } else {
      document.title = 'SafeRoute';
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};

export default useDocumentTitle;
