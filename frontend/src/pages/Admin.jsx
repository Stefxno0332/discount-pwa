import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiPackage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';

const Admin = () => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const [formData, setFormData] = useState({
        asin: '',
        title: '',
        imageUrl: '',
        originalPrice: '',
        discountedPrice: '',
        category: 'Electronics',
        rating: '',
        reviewCount: '',
        brand: '',
        affiliateLink: ''
    });

    const categories = [
        'Electronics', 'Computers', 'HomeAndGarden', 'Kitchen',
        'Fashion', 'Beauty', 'Sports', 'Toys', 'VideoGames'
    ];

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/products?limit=50');
            setProducts(response.data.data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            asin: '', title: '', imageUrl: '', originalPrice: '',
            discountedPrice: '', category: 'Electronics', rating: '',
            reviewCount: '', brand: '', affiliateLink: ''
        });
        setEditingProduct(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.asin || !formData.title || !formData.imageUrl ||
            !formData.originalPrice || !formData.discountedPrice) {
            toast.error('Compila tutti i campi obbligatori');
            return;
        }

        try {
            const payload = {
                ...formData,
                originalPrice: parseFloat(formData.originalPrice),
                discountedPrice: parseFloat(formData.discountedPrice),
                rating: formData.rating ? parseFloat(formData.rating) : 0,
                reviewCount: formData.reviewCount ? parseInt(formData.reviewCount) : 0
            };

            if (editingProduct) {
                await api.put(`/products/${editingProduct.asin}`, payload);
                toast.success('Prodotto aggiornato!');
            } else {
                await api.post('/products', payload);
                toast.success('Prodotto creato!');
            }

            resetForm();
            fetchProducts();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Errore nel salvataggio');
        }
    };

    const handleEdit = (product) => {
        setFormData({
            asin: product.asin,
            title: product.title,
            imageUrl: product.imageUrl,
            originalPrice: product.originalPrice.toString(),
            discountedPrice: product.discountedPrice.toString(),
            category: product.category,
            rating: product.rating?.toString() || '',
            reviewCount: product.reviewCount?.toString() || '',
            brand: product.brand || '',
            affiliateLink: product.affiliateLink || ''
        });
        setEditingProduct(product);
        setShowForm(true);
    };

    const handleDelete = async (asin) => {
        if (!confirm('Sei sicuro di voler eliminare questo prodotto?')) return;

        try {
            await api.delete(`/products/${asin}`);
            toast.success('Prodotto eliminato!');
            fetchProducts();
        } catch (error) {
            toast.error('Errore nell\'eliminazione');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Admin Panel</h1>
                        <p className="text-gray-500 dark:text-dark-muted">Gestisci i prodotti manualmente</p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <FiPlus className="w-5 h-5" />
                        Aggiungi Prodotto
                    </button>
                </div>

                {/* Product Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold">
                                        {editingProduct ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
                                    </h2>
                                    <button onClick={resetForm} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg">
                                        <FiX className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">ASIN *</label>
                                            <input
                                                type="text"
                                                name="asin"
                                                value={formData.asin}
                                                onChange={handleInputChange}
                                                placeholder="B0CL5KNB9M"
                                                className="input"
                                                disabled={!!editingProduct}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Categoria *</label>
                                            <select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleInputChange}
                                                className="input"
                                            >
                                                {categories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Titolo *</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            placeholder="Nome prodotto..."
                                            className="input"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">URL Immagine *</label>
                                        <input
                                            type="url"
                                            name="imageUrl"
                                            value={formData.imageUrl}
                                            onChange={handleInputChange}
                                            placeholder="https://..."
                                            className="input"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Prezzo Originale (€) *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                name="originalPrice"
                                                value={formData.originalPrice}
                                                onChange={handleInputChange}
                                                placeholder="99.99"
                                                className="input"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Prezzo Scontato (€) *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                name="discountedPrice"
                                                value={formData.discountedPrice}
                                                onChange={handleInputChange}
                                                placeholder="49.99"
                                                className="input"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Brand</label>
                                            <input
                                                type="text"
                                                name="brand"
                                                value={formData.brand}
                                                onChange={handleInputChange}
                                                placeholder="Amazon"
                                                className="input"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Rating (0-5)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="5"
                                                name="rating"
                                                value={formData.rating}
                                                onChange={handleInputChange}
                                                placeholder="4.5"
                                                className="input"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">N° Recensioni</label>
                                            <input
                                                type="number"
                                                name="reviewCount"
                                                value={formData.reviewCount}
                                                onChange={handleInputChange}
                                                placeholder="1500"
                                                className="input"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Link Affiliato</label>
                                        <input
                                            type="url"
                                            name="affiliateLink"
                                            value={formData.affiliateLink}
                                            onChange={handleInputChange}
                                            placeholder="https://www.amazon.it/dp/...?tag=tuotag-21"
                                            className="input"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button type="button" onClick={resetForm} className="btn-secondary flex-1">
                                            Annulla
                                        </button>
                                        <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                                            <FiSave className="w-4 h-4" />
                                            {editingProduct ? 'Aggiorna' : 'Salva'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Products Table */}
                <div className="card overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Caricamento...</div>
                    ) : products.length === 0 ? (
                        <div className="p-8 text-center">
                            <FiPackage className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">Nessun prodotto. Clicca "Aggiungi Prodotto" per iniziare.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-dark-border">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Prodotto</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Categoria</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Prezzo</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Sconto</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
                                    {products.map((product) => (
                                        <tr key={product.asin} className="hover:bg-gray-50 dark:hover:bg-dark-border/50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={product.imageUrl}
                                                        alt={product.title}
                                                        className="w-12 h-12 object-cover rounded"
                                                    />
                                                    <div className="max-w-xs">
                                                        <p className="font-medium truncate">{product.title}</p>
                                                        <p className="text-xs text-gray-500">{product.asin}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">{product.category}</td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm">
                                                    <span className="line-through text-gray-400">€{product.originalPrice}</span>
                                                    <span className="ml-2 font-bold text-green-600">€{product.discountedPrice}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 bg-amazon-orange/10 text-amazon-orange rounded-full text-sm font-medium">
                                                    -{product.discountPercentage}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(product)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg text-blue-500"
                                                    >
                                                        <FiEdit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.asin)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg text-red-500"
                                                    >
                                                        <FiTrash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Admin;
