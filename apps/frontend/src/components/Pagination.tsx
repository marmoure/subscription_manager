import React, { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange?: (pageSize: number) => void;
  totalResults?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalResults,
}) => {
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  }, [currentPage, totalPages, onPageChange]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        handlePageChange(currentPage - 1);
      } else if (event.key === 'ArrowRight') {
        handlePageChange(currentPage + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPage, handlePageChange]);

  const renderPageButtons = () => {
    const pages = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logic for ellipsis
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages.map((page, index) => {
      if (page === 'ellipsis') {
        return (
          <span
            key={`ellipsis-${index}`}
            className="flex h-9 w-9 items-center justify-center text-slate-400"
          >
            <MoreHorizontal className="h-4 w-4" />
          </span>
        );
      }

      const isCurrent = page === currentPage;
      return (
        <Button
          key={page}
          variant={isCurrent ? 'default' : 'outline'}
          size="icon"
          className={cn(
            "h-9 w-9 hidden md:inline-flex",
            isCurrent && "pointer-events-none"
          )}
          onClick={() => handlePageChange(page as number)}
        >
          {page}
        </Button>
      );
    });
  };

  const startResult = (currentPage - 1) * pageSize + 1;
  const endResult = Math.min(currentPage * pageSize, totalResults || 0);

  return (
    <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center justify-between py-4">
      <div className="text-sm text-muted-foreground order-2 md:order-1 text-center md:text-left">
        {totalResults ? (
          <>
            Showing <span className="font-medium text-slate-900 dark:text-slate-200">{startResult}</span> to{' '}
            <span className="font-medium text-slate-900 dark:text-slate-200">{endResult}</span> of{' '}
            <span className="font-medium text-slate-900 dark:text-slate-200">{totalResults}</span> results
          </>
        ) : (
          `Page ${currentPage} of ${totalPages}`
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 order-1 md:order-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous Page</span>
          </Button>

          {renderPageButtons()}

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 md:hidden"
            disabled
          >
            {currentPage} / {totalPages}
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next Page</span>
          </Button>
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">Show</span>
            <select
              className="flex h-9 w-[70px] rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {[20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
