import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiHeart, FiExternalLink, FiColumns, FiShare2, FiArrowLeft } from 'react-icons/fi';
import { useProductsStore, useAuthStore, useWatchlistStore } from '../store';
import { PriceChart } from '../components';
import api from '../services/api';
import toast from 'react-hot-toast';

const ProductDetail = () => {
    const { id } = useParams();
    const [priceHistory, setPriceHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const { currentProduct, isLoading, fetchProduct } = useProductsStore();
    const { isAuthenticated } = useAuthStore();
    const { isInWatchlist, addToWatchlist, removeFromWatchlist, addToCompare, compareList } = useWatchlistStore();

    const product = currentProduct;
    const inWatchlist = product && isAuthenticated && isInWatchlist(product.asin || product._id);
    const inCompare = product && compareList.some(p => p._id === product._id);

    useEffect(() => {
        fetchProduct(id);
        loadPriceHistory();
    }, [id]);

    const loadPriceHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const response = await api.get(`/products/${id}/price-history?days=30`);
            setPriceHistory(response.data.data.priceHistory);
        } catch (error) {
            console.error('Failed to load price history:', error);
        }
        setIsLoadingHistory(false);
    };

    const handleWatchlist = async () => {
        if (!isAuthenticated) {
            toast.error('Accedi per usare la watchlist');
            return;
        }

        const productId = product.asin || product._id;

        if (inWatchlist) {
            const result = await removeFromWatchlist(productId);
            if (result.success) {
                toast.success('Rimosso dalla watchlist');
            }
        } else {
            const result = await addToWatchlist(productId);
            if (result.success) {
                toast.success('Aggiunto alla watchlist');
            } else {
                toast.error(result.error);
            }
        }
    };

    const handleCompare = async () => {
        if (!isAuthenticated) {
            toast.error('Accedi per confrontare prodotti');
            return;
        }

        if (inCompare) {
            toast('Prodotto già nella lista confronto');
            return;
        }

        if (compareList.length >= 4) {
            toast.error('Puoi confrontare massimo 4 prodotti');
            return;
        }

        const result = await addToCompare(product._id);
        if (result.success) {
            toast.success('Aggiunto al confronto');
        } else {
            toast.error(result.error);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: product.title,
            text: `Sconto ${product.discountPercentage}%! ${product.title} a €${product.discountedPrice.toFixed(2)}`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copiato!');
        }
    };

    if (isLoading || !product) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse">
                    <div className="h-8 w-32 bg-gray-200 dark:bg-dark-border rounded mb-8" />
                    <div className="grid lg:grid-cols-2 gap-8">
                        <div className="aspect-square bg-gray-200 dark:bg-dark-border rounded-xl" />
                        <div className="space-y-4">
                            <div className="h-8 bg-gray-200 dark:bg-dark-border rounded w-3/4" />
                            <div className="h-4 bg-gray-200 dark:bg-dark-border rounded w-1/4" />
                            <div className="h-12 bg-gray-200 dark:bg-dark-border rounded w-1/2" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
            <div className="container mx-auto px-4 py-8">
                {/* Back Button */}
                <Link to="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-dark-muted hover:text-amazon-orange mb-6">
                    <FiArrowLeft />
                    Torna alle offerte
                </Link>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Image */}
                    <div className="card p-8">
                        <div className="relative">
                            <span className="absolute top-4 left-4 bg-red-500 text-white text-lg font-bold px-3 py-1.5 rounded-lg z-10">
                                -{product.discountPercentage}%
                            </span>
                            <img
                                src={product.imageUrl}
                                alt={product.title}
                                className="w-full max-h-[500px] object-contain mx-auto"
                            />
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-6">
                        {/* Category & Brand */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-amazon-orange font-medium uppercase">
                                {product.category}
                            </span>
                            {product.brand && (
                                <>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-sm text-gray-500 dark:text-dark-muted">
                                        {product.brand}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                            {product.title}
                        </h1>

                        {/* Rating */}
                        {product.rating > 0 && (
                            <div className="flex items-center gap-2">
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className={`text-xl ${i < Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                                            ★
                                        </span>
                                    ))}
                                </div>
                                <span className="text-gray-500 dark:text-dark-muted">
                                    {product.rating.toFixed(1)} ({product.reviewCount?.toLocaleString()} recensioni)
                                </span>
                            </div>
                        )}

                        {/* Price */}
                        <div className="card p-6 bg-gradient-to-r from-amazon-orange/10 to-transparent">
                            <div className="flex items-baseline gap-4">
                                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                    €{product.discountedPrice?.toFixed(2)}
                                </span>
                                <span className="text-xl text-gray-500 line-through">
                                    €{product.originalPrice?.toFixed(2)}
                                </span>
                                <span className="badge-hot text-base">
                                    Risparmi €{(product.originalPrice - product.discountedPrice).toFixed(2)}
                                </span>
                            </div>

                            {product.lowestPrice && (
                                <p className="text-sm text-gray-500 dark:text-dark-muted mt-2">
                                    📉 Prezzo più basso: €{product.lowestPrice.toFixed(2)}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3">
                            <a
                                href={product.affiliateLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 text-lg"
                            >
                                <FiExternalLink className="w-5 h-5" />
                                Vai su Amazon
                            </a>

                            <button
                                onClick={handleWatchlist}
                                className={`btn p-3 rounded-lg ${inWatchlist
                                    ? 'bg-red-500 text-white'
                                    : 'btn-secondary'
                                    }`}
                            >
                                <FiHeart className={`w-6 h-6 ${inWatchlist ? 'fill-current' : ''}`} />
                            </button>

                            <button
                                onClick={handleCompare}
                                className={`btn p-3 rounded-lg ${inCompare ? 'bg-blue-500 text-white' : 'btn-secondary'}`}
                            >
                                <FiColumns className="w-6 h-6" />
                            </button>

                            <button
                                onClick={handleShare}
                                className="btn-secondary p-3 rounded-lg"
                            >
                                <FiShare2 className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Features */}
                        {product.features && product.features.length > 0 && (
                            <div className="card p-6">
                                <h3 className="font-semibold mb-4">Caratteristiche</h3>
                                <ul className="space-y-2">
                                    {product.features.slice(0, 5).map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-dark-muted">
                                            <span className="text-amazon-orange mt-1">•</span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Price History Chart */}
                <div className="mt-8">
                    <PriceChart priceHistory={priceHistory || product.priceHistory} />
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
