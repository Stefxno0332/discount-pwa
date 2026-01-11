export { default as ProductCard } from './ProductCard';
export { default as Header } from './Header';
export { default as FilterPanel } from './FilterPanel';
export { default as PriceChart } from './PriceChart';
export { default as ProductComparison } from './ProductComparison';

// Loading skeleton component
export const ProductSkeleton = () => (
    <div className="card overflow-hidden animate-pulse">
        <div className="aspect-square bg-gray-200 dark:bg-dark-border" />
        <div className="p-4 space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-dark-border rounded w-1/4" />
            <div className="h-4 bg-gray-200 dark:bg-dark-border rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-dark-border rounded w-3/4" />
            <div className="flex gap-2">
                <div className="h-6 bg-gray-200 dark:bg-dark-border rounded w-20" />
                <div className="h-6 bg-gray-200 dark:bg-dark-border rounded w-16" />
            </div>
            <div className="h-10 bg-gray-200 dark:bg-dark-border rounded" />
        </div>
    </div>
);

// Pagination component
export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    return (
        <div className="flex items-center justify-center gap-2">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn-ghost px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                ←
            </button>

            {startPage > 1 && (
                <>
                    <button onClick={() => onPageChange(1)} className="btn-ghost px-3 py-2">
                        1
                    </button>
                    {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
                </>
            )}

            {pages.map((page) => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors ${page === currentPage
                            ? 'bg-amazon-orange text-white'
                            : 'btn-ghost'
                        }`}
                >
                    {page}
                </button>
            ))}

            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
                    <button onClick={() => onPageChange(totalPages)} className="btn-ghost px-3 py-2">
                        {totalPages}
                    </button>
                </>
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn-ghost px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                →
            </button>
        </div>
    );
};
