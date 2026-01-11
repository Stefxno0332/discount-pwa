import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiDownload, FiTrash2 } from 'react-icons/fi';
import { useWatchlistStore, useAuthStore } from '../store';
import { ProductCard, ProductSkeleton } from '../components';
import api from '../services/api';
import toast from 'react-hot-toast';

const Watchlist = () => {
    const { isAuthenticated } = useAuthStore();
    const { watchlist, isLoading, fetchWatchlist, removeFromWatchlist } = useWatchlistStore();

    useEffect(() => {
        if (isAuthenticated) {
            fetchWatchlist();
        }
    }, [isAuthenticated]);

    const handleRemove = async (productId) => {
        const result = await removeFromWatchlist(productId);
        if (result.success) {
            toast.success('Rimosso dalla watchlist');
        }
    };

    const handleExportCSV = async () => {
        try {
            toast.loading('Generando CSV...');
            // In a real app, this would call the backend export endpoint
            const csvContent = watchlist.map(p =>
                `"${p.title}","${p.category}",${p.originalPrice},${p.discountedPrice},${p.discountPercentage}%,"${p.affiliateLink}"`
            ).join('\n');

            const header = 'Titolo,Categoria,Prezzo Originale,Prezzo Scontato,Sconto,Link\n';
            const blob = new Blob([header + csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'watchlist.csv';
            a.click();

            toast.dismiss();
            toast.success('CSV scaricato!');
        } catch (error) {
            toast.dismiss();
            toast.error('Errore export');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
                <div className="text-center">
                    <FiHeart className="w-16 h-16 text-gray-300 dark:text-dark-border mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Watchlist</h2>
                    <p className="text-gray-500 dark:text-dark-muted mb-6">
                        Accedi per salvare i tuoi prodotti preferiti
                    </p>
                    <Link to="/login" className="btn-primary">
                        Accedi
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">La tua Watchlist</h1>
                        <p className="text-gray-500 dark:text-dark-muted">
                            {watchlist.length} prodotti salvati
                        </p>
                    </div>

                    {watchlist.length > 0 && (
                        <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2">
                            <FiDownload className="w-4 h-4" />
                            Esporta CSV
                        </button>
                    )}
                </div>

                {/* Products Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <ProductSkeleton key={i} />
                        ))}
                    </div>
                ) : watchlist.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {watchlist.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <FiHeart className="w-16 h-16 text-gray-300 dark:text-dark-border mx-auto mb-4" />
                        <h2 className="text-xl font-medium mb-2">Nessun prodotto salvato</h2>
                        <p className="text-gray-500 dark:text-dark-muted mb-6">
                            Aggiungi prodotti alla tua watchlist per ricevere notifiche sui prezzi
                        </p>
                        <Link to="/" className="btn-primary">
                            Esplora Offerte
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Watchlist;
