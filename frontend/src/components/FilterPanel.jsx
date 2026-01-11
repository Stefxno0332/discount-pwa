import { useEffect } from 'react';
import { FiX, FiSliders } from 'react-icons/fi';
import { useProductsStore } from '../store';

const FilterPanel = ({ isOpen, onClose }) => {
    const { filters, setFilters, resetFilters, categories, fetchCategories } = useProductsStore();

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleFilterChange = (key, value) => {
        setFilters({ [key]: value });
    };

    const sortOptions = [
        { value: 'dealScore', label: 'Migliori Offerte' },
        { value: 'discountPercentage', label: 'Sconto %' },
        { value: 'discountedPrice', label: 'Prezzo' },
        { value: 'rating', label: 'Valutazione' },
        { value: 'createdAt', label: 'Più Recenti' }
    ];

    const discountOptions = [
        { value: 0, label: 'Tutti' },
        { value: 10, label: '≥10%' },
        { value: 20, label: '≥20%' },
        { value: 30, label: '≥30%' },
        { value: 50, label: '≥50%' },
        { value: 70, label: '≥70%' }
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/50"
                    onClick={onClose}
                />
            )}

            {/* Filter Panel */}
            <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
        w-72 lg:w-64 bg-white dark:bg-dark-card
        lg:bg-transparent lg:dark:bg-transparent
        transform transition-transform duration-300 lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        overflow-y-auto
      `}>
                <div className="lg:card p-4 lg:sticky lg:top-20">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                            <FiSliders className="w-5 h-5 text-amazon-orange" />
                            Filtri
                        </div>
                        <button
                            onClick={onClose}
                            className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Category Filter */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-muted">
                            Categoria
                        </label>
                        <select
                            value={filters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                            className="input text-sm"
                        >
                            <option value="">Tutte le categorie</option>
                            {categories.map((cat) => (
                                <option key={cat.name} value={cat.name}>
                                    {cat.name} ({cat.count})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Discount Filter */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-muted">
                            Sconto Minimo
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {discountOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleFilterChange('minDiscount', option.value)}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${filters.minDiscount === option.value
                                            ? 'bg-amazon-orange text-white'
                                            : 'bg-gray-100 dark:bg-dark-border hover:bg-amazon-orange/20'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price Range */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-muted">
                            Fascia di Prezzo
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                value={filters.minPrice}
                                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                className="input text-sm"
                                min="0"
                            />
                            <span className="self-center text-gray-400">-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={filters.maxPrice}
                                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                className="input text-sm"
                                min="0"
                            />
                        </div>
                    </div>

                    {/* Sort */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-muted">
                            Ordina per
                        </label>
                        <select
                            value={filters.sortBy}
                            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                            className="input text-sm"
                        >
                            {sortOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={() => handleFilterChange('sortOrder', 'desc')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${filters.sortOrder === 'desc'
                                        ? 'bg-amazon-orange text-white'
                                        : 'bg-gray-100 dark:bg-dark-border hover:bg-amazon-orange/20'
                                    }`}
                            >
                                ↓ Decrescente
                            </button>
                            <button
                                onClick={() => handleFilterChange('sortOrder', 'asc')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${filters.sortOrder === 'asc'
                                        ? 'bg-amazon-orange text-white'
                                        : 'bg-gray-100 dark:bg-dark-border hover:bg-amazon-orange/20'
                                    }`}
                            >
                                ↑ Crescente
                            </button>
                        </div>
                    </div>

                    {/* Reset Button */}
                    <button
                        onClick={resetFilters}
                        className="w-full btn-secondary"
                    >
                        Resetta Filtri
                    </button>
                </div>
            </div>
        </>
    );
};

export default FilterPanel;
