import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

export const Pagination = ({
  pagination = {},
  onPageChange,
  className = '',
}) => {
  const {
    totalItems = 0,
    totalPages = 1,
    currentPage = 1,
    itemsPerPage = 10,
  } = pagination;

  if (totalItems <= 0 || totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <nav
      aria-label="Pagination Navigation"
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 border-t border-line text-sm text-ink-soft ${className}`}
    >
      <div className="text-xs">
        Showing <span className="font-semibold text-ink">{startItem}</span> to{' '}
        <span className="font-semibold text-ink">{endItem}</span> of{' '}
        <span className="font-semibold text-ink">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange?.(currentPage - 1)}
          leftIcon={ChevronLeft}
          aria-label="Previous page"
        >
          Previous
        </Button>

        <span className="text-xs px-2 text-ink-soft">
          Page <span className="font-semibold text-ink">{currentPage}</span> of{' '}
          <span className="font-semibold text-ink">{totalPages}</span>
        </span>

        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange?.(currentPage + 1)}
          rightIcon={ChevronRight}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </nav>
  );
};

export default Pagination;
