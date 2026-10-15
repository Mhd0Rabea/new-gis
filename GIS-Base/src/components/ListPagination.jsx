import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button.jsx';

export function ListPagination({ currentPage, totalPages, onPageChange, showPageSize = false, pageSize, onPageSizeChange }) {
  if (totalPages <= 1 && !showPageSize) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="list-pagination" aria-label="ترقيم الصفحات">
      {showPageSize && pageSize && onPageSizeChange && (
        <div className="pagination-page-size">
          <label>
            <span>عناصر في الصفحة</span>
            <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>
      )}
      <Button
        variant="ghost"
        size="compact"
        iconOnly
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        aria-label="الصفحة الأولى"
      >
        <ChevronLeft size={16} />
      </Button>
      <Button
        variant="ghost"
        size="compact"
        iconOnly
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="الصفحة السابقة"
      >
        <ChevronLeft size={16} />
      </Button>
      <span className="pagination-pages" role="group" aria-label="الصفحات">
        {start > 1 && (
          <>
            <button className="page-btn" onClick={() => onPageChange(1)}>1</button>
            {start > 2 && <span className="page-ellipsis">…</span>}
          </>
        )}
        {pages.map((page) => (
          <button
            key={page}
            className={`page-btn ${page === currentPage ? 'active' : ''}`}
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="page-ellipsis">…</span>}
            <button className="page-btn" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
          </>
        )}
      </span>
      <Button
        variant="ghost"
        size="compact"
        iconOnly
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="الصفحة التالية"
      >
        <ChevronRight size={16} />
      </Button>
      <Button
        variant="ghost"
        size="compact"
        iconOnly
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        aria-label="الصفحة الأخيرة"
      >
        <ChevronRight size={16} />
      </Button>
      <span className="pagination-info">
        صفحة {currentPage} من {totalPages}
      </span>
    </div>
  );
}