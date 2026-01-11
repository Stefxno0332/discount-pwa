import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiColumns } from 'react-icons/fi';
import { useWatchlistStore, useAuthStore } from '../store';
import { ProductComparison } from '../components';
import toast from 'react-hot-toast';

const Compare = () => {
    const { isAuthenticated } = useAuthStore();
    const { compareList, fetchCompareList, removeFromCompare, clearCompare } = useWatchlistStore();

    useEffect(() => {
        if (isAuthenticated) {
            fetchCompareList();
        }
    }, [isAuthenticated]);

    const handleRemove = async (productId) => {
        const result = await removeFromCompare(productId);
        if (result.success) {
            toast.success('Rimosso dal confronto');
        }
    };

    const handleClear = async () => {
        await clearCompare();
        toast.success('Lista confronto svuotata');
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
                <div className="text-center">
                    <FiColumns className="w-16 h-16 text-gray-300 dark:text-dark-border mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Confronta Prodotti</h2>
                    <p className="text-gray-500 dark:text-dark-muted mb-6">
                        Accedi per confrontare prodotti
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
                <div className="mb-8">
                    <h1 className="text-2xl font-bold">Confronta Prodotti</h1>
                    <p className="text-gray-500 dark:text-dark-muted">
                        {compareList.length} di 4 prodotti selezionati
                    </p>
                </div>

                {/* Comparison */}
                <ProductComparison
                    products={compareList}
                    onRemove={handleRemove}
                    onClear={handleClear}
                />

                {compareList.length === 0 && (
                    <div className="text-center py-8">
                        <Link to="/" className="btn-primary">
                            Esplora Offerte
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Compare;
