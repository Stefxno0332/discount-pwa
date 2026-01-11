import { FiTrash2, FiExternalLink } from 'react-icons/fi';

const ProductComparison = ({ products, onRemove, onClear }) => {
    if (!products || products.length === 0) {
        return (
            <div className="card p-8 text-center">
                <p className="text-gray-500 dark:text-dark-muted">
                    Nessun prodotto da confrontare. Aggiungi prodotti dalla pagina di dettaglio.
                </p>
            </div>
        );
    }

    const features = [
        { key: 'discountedPrice', label: 'Prezzo Attuale', format: (v) => `€${v?.toFixed(2)}` },
        { key: 'originalPrice', label: 'Prezzo Originale', format: (v) => `€${v?.toFixed(2)}` },
        { key: 'discountPercentage', label: 'Sconto', format: (v) => `${v}%` },
        { key: 'rating', label: 'Valutazione', format: (v) => v ? `${v}/5 ⭐` : 'N/A' },
        { key: 'reviewCount', label: 'Recensioni', format: (v) => v?.toLocaleString() || '0' },
        { key: 'brand', label: 'Brand', format: (v) => v || 'N/A' },
        { key: 'category', label: 'Categoria', format: (v) => v || 'N/A' }
    ];

    const getBestValue = (key) => {
        if (key === 'discountedPrice') {
            return Math.min(...products.map(p => p[key] || Infinity));
        }
        if (key === 'discountPercentage' || key === 'rating' || key === 'reviewCount') {
            return Math.max(...products.map(p => p[key] || 0));
        }
        return null;
    };

    return (
        <div className="card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border">
                <h3 className="text-lg font-semibold">Confronto Prodotti</h3>
                {products.length > 0 && (
                    <button onClick={onClear} className="btn-ghost text-sm text-red-500">
                        Cancella tutto
                    </button>
                )}
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    {/* Product Headers */}
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-dark-border">
                            <th className="p-4 text-left text-sm font-medium text-gray-500 dark:text-dark-muted w-40">
                                Prodotto
                            </th>
                            {products.map((product) => (
                                <th key={product._id} className="p-4 min-w-[200px]">
                                    <div className="relative">
                                        <button
                                            onClick={() => onRemove(product._id)}
                                            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            <FiTrash2 className="w-3 h-3" />
                                        </button>
                                        <img
                                            src={product.imageUrl}
                                            alt={product.title}
                                            className="w-32 h-32 object-contain mx-auto mb-3"
                                        />
                                        <h4 className="text-sm font-medium text-center line-clamp-2">
                                            {product.title}
                                        </h4>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* Comparison Rows */}
                    <tbody>
                        {features.map((feature) => {
                            const bestValue = getBestValue(feature.key);

                            return (
                                <tr key={feature.key} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                                    <td className="p-4 text-sm font-medium text-gray-500 dark:text-dark-muted">
                                        {feature.label}
                                    </td>
                                    {products.map((product) => {
                                        const value = product[feature.key];
                                        const isBest = bestValue !== null && value === bestValue;

                                        return (
                                            <td key={product._id} className="p-4 text-center">
                                                <span className={`text-sm font-medium ${isBest ? 'text-green-500' : 'text-gray-900 dark:text-dark-text'
                                                    }`}>
                                                    {feature.format(value)}
                                                    {isBest && ' ✓'}
                                                </span>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}

                        {/* Action Row */}
                        <tr>
                            <td className="p-4"></td>
                            {products.map((product) => (
                                <td key={product._id} className="p-4 text-center">
                                    <a
                                        href={product.affiliateLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-primary inline-flex items-center gap-2 text-sm"
                                    >
                                        <FiExternalLink className="w-4 h-4" />
                                        Vai su Amazon
                                    </a>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductComparison;
