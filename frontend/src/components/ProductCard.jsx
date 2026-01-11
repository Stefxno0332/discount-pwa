import { Link } from 'react-router-dom';
import { FiHeart, FiExternalLink, FiBarChart2 } from 'react-icons/fi';
import { useAuthStore, useWatchlistStore } from '../store';
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
    const { isAuthenticated } = useAuthStore();
    const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlistStore();

    const inWatchlist = isAuthenticated && isInWatchlist(product.asin || product._id);

    const handleWatchlistClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            toast.error('Accedi per aggiungere alla watchlist');
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
                toast.error(result.error || 'Errore');
            }
        }
    };

    const getBadge = () => {
        if (product.dealBadge === 'best_deal') {
            return <span className="badge-best">🏆 Best Deal</span>;
        }
        if (product.dealBadge === 'biggest_discount') {
            return <span className="badge-hot">🔥 Mega Sconto</span>;
        }
        if (product.dealBadge === 'most_popular') {
            return <span className="badge-discount">⭐ Popolare</span>;
        }
        if (product.discountPercentage >= 40) {
            return <span className="badge-hot">🔥 Hot</span>;
        }
        return null;
    };

    return (
        <Link to={`/product/${product.asin || product._id}`}>
            <div className="card-hover group overflow-hidden">
                {/* Image Container */}
                <div className="relative aspect-square bg-gray-50 dark:bg-dark-bg overflow-hidden">
                    <img
                        src={product.imageUrl || '/placeholder.png'}
                        alt={product.title}
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                    />

                    {/* Discount Badge */}
                    <div className="absolute top-3 left-3">
                        <span className="bg-red-500 text-white text-sm font-bold px-2.5 py-1 rounded-lg shadow-lg">
                            -{product.discountPercentage}%
                        </span>
                    </div>

                    {/* Deal Badge */}
                    {getBadge() && (
                        <div className="absolute top-3 right-3">
                            {getBadge()}
                        </div>
                    )}

                    {/* Watchlist Button */}
                    <button
                        onClick={handleWatchlistClick}
                        className={`absolute bottom-3 right-3 p-2.5 rounded-full transition-all duration-200 
              ${inWatchlist
                                ? 'bg-red-500 text-white'
                                : 'bg-white/90 dark:bg-dark-card/90 text-gray-600 dark:text-dark-muted hover:bg-red-500 hover:text-white'
                            } shadow-md backdrop-blur-sm`}
                    >
                        <FiHeart className={`w-5 h-5 ${inWatchlist ? 'fill-current' : ''}`} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Category */}
                    <span className="text-xs text-amazon-orange font-medium uppercase tracking-wide">
                        {product.category}
                    </span>

                    {/* Title */}
                    <h3 className="mt-1 text-sm font-medium text-gray-900 dark:text-dark-text line-clamp-2 group-hover:text-amazon-orange transition-colors">
                        {product.title}
                    </h3>

                    {/* Rating */}
                    {product.rating > 0 && (
                        <div className="mt-2 flex items-center gap-1">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className={`text-sm ${i < Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-dark-border'}`}>
                                        ★
                                    </span>
                                ))}
                            </div>
                            <span className="text-xs text-gray-500 dark:text-dark-muted">
                                ({product.reviewCount?.toLocaleString()})
                            </span>
                        </div>
                    )}

                    {/* Price */}
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                            €{product.discountedPrice?.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                            €{product.originalPrice?.toFixed(2)}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                        <a
                            href={product.affiliateLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 btn-primary text-center text-sm flex items-center justify-center gap-2"
                        >
                            <FiExternalLink className="w-4 h-4" />
                            Amazon
                        </a>
                        <Link
                            to={`/product/${product.asin || product._id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="btn-secondary text-sm flex items-center justify-center px-3"
                        >
                            <FiBarChart2 className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
