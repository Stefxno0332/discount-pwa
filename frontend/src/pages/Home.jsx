import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSliders, FiActivity, FiBox, FiPercent } from 'react-icons/fi';
import { useProductsStore, useAuthStore, useWatchlistStore, useAppStore } from '../store';
import { ProductCard, ProductSkeleton, FilterPanel, Pagination } from '../components';

const Home = () => {
    const [searchParams] = useSearchParams();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const { darkMode } = useAppStore();

    const {
        products,
        stats,
        pagination,
        isLoading,
        filters,
        setFilters,
        setPage,
        fetchProducts,
        fetchStats
    } = useProductsStore();

    const { isAuthenticated } = useAuthStore();
    const { fetchWatchlist } = useWatchlistStore();

    useEffect(() => {
        // Initialize dark mode
        if (darkMode) {
            document.documentElement.classList.add('dark');
        }

        // Check URL params for search
        const search = searchParams.get('search');
        if (search) {
            setFilters({ search });
        }

        fetchStats();
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchWatchlist();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchProducts();
    }, [filters, pagination.page]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-amazon-blue via-amazon-blue-dark to-black py-12 md:py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center">
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                            Le Migliori <span className="gradient-text">Offerte Amazon</span>
                        </h1>
                        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                            Monitora gli sconti in tempo reale. Salva i tuoi prodotti preferiti e ricevi notifiche quando il prezzo scende.
                        </p>
                    </div>

                    {/* Stats */}
                    {stats && (
                        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                            <div className="glass rounded-xl p-4 text-center">
                                <FiBox className="w-6 h-6 text-amazon-orange mx-auto mb-2" />
                                <p className="text-2xl font-bold text-white">{stats.totalProducts?.toLocaleString()}</p>
                                <p className="text-sm text-gray-400">Prodotti Monitorati</p>
                            </div>
                            <div className="glass rounded-xl p-4 text-center">
                                <FiPercent className="w-6 h-6 text-amazon-orange mx-auto mb-2" />
                                <p className="text-2xl font-bold text-white">{stats.averageDiscount}%</p>
                                <p className="text-sm text-gray-400">Sconto Medio</p>
                            </div>
                            <div className="hidden md:block glass rounded-xl p-4 text-center">
                                <FiActivity className="w-6 h-6 text-amazon-orange mx-auto mb-2" />
                                <p className="text-2xl font-bold text-white">24/7</p>
                                <p className="text-sm text-gray-400">Monitoraggio</p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="flex gap-6">
                    {/* Filters Sidebar */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <FilterPanel isOpen={true} onClose={() => { }} />
                    </aside>

                    {/* Products Grid */}
                    <div className="flex-1">
                        {/* Mobile Filter Button & Results Count */}
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-sm text-gray-500 dark:text-dark-muted">
                                {pagination.total} prodotti trovati
                            </p>
                            <button
                                onClick={() => setIsFilterOpen(true)}
                                className="lg:hidden btn-secondary flex items-center gap-2"
                            >
                                <FiSliders className="w-4 h-4" />
                                Filtri
                            </button>
                        </div>

                        {/* Active Filters */}
                        {(filters.category || filters.minDiscount > 0 || filters.search) && (
                            <div className="flex flex-wrap gap-2 mb-6">
                                {filters.search && (
                                    <span className="badge bg-amazon-orange/10 text-amazon-orange">
                                        Ricerca: {filters.search}
                                        <button onClick={() => setFilters({ search: '' })} className="ml-2">×</button>
                                    </span>
                                )}
                                {filters.category && (
                                    <span className="badge bg-amazon-orange/10 text-amazon-orange">
                                        {filters.category}
                                        <button onClick={() => setFilters({ category: '' })} className="ml-2">×</button>
                                    </span>
                                )}
                                {filters.minDiscount > 0 && (
                                    <span className="badge bg-amazon-orange/10 text-amazon-orange">
                                        ≥{filters.minDiscount}% sconto
                                        <button onClick={() => setFilters({ minDiscount: 0 })} className="ml-2">×</button>
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Products Grid */}
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[...Array(8)].map((_, i) => (
                                    <ProductSkeleton key={i} />
                                ))}
                            </div>
                        ) : products.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {products.map((product) => (
                                        <ProductCard key={product._id || product.asin} product={product} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                <div className="mt-10">
                                    <Pagination
                                        currentPage={pagination.page}
                                        totalPages={pagination.pages}
                                        onPageChange={setPage}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-16">
                                <p className="text-xl text-gray-500 dark:text-dark-muted">
                                    Nessun prodotto trovato
                                </p>
                                <p className="text-sm text-gray-400 mt-2">
                                    Prova a modificare i filtri di ricerca
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Mobile Filter Panel - hidden on desktop */}
            <div className="lg:hidden">
                <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
            </div>
        </div>
    );
};

export default Home;
