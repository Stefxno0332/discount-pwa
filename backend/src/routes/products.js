import { Router } from 'express';
import { Product } from '../models/index.js';
import { asyncHandler } from '../middleware/index.js';
import { optionalAuth, authenticate, isAdmin } from '../middleware/auth.js';
import { cacheGet, cacheSet } from '../config/redis.js';
import socialService from '../services/social/socialService.js';

const router = Router();

// IMPORTANT: Static routes must come BEFORE dynamic /:id routes

// Get available categories
router.get('/meta/categories', asyncHandler(async (req, res) => {
    const cacheKey = 'products:categories';
    const cached = await cacheGet(cacheKey);

    if (cached) {
        return res.json(cached);
    }

    // Count products per category
    const categoryCounts = await Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    const response = {
        success: true,
        data: categoryCounts.map(c => ({
            name: c._id,
            count: c.count
        }))
    };

    // Cache for 1 hour
    await cacheSet(cacheKey, response, 3600);

    res.json(response);
}));

// Get top deals
router.get('/meta/top-deals', asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const cacheKey = `products:top-deals:${limit}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
        return res.json(cached);
    }

    const topDeals = await Product.find({ isActive: true })
        .sort({ dealScore: -1 })
        .limit(parseInt(limit))
        .lean();

    const response = { success: true, data: topDeals };

    // Cache for 15 minutes
    await cacheSet(cacheKey, response, 900);

    res.json(response);
}));

// Get statistics
router.get('/meta/stats', asyncHandler(async (req, res) => {
    const cacheKey = 'products:stats';
    const cached = await cacheGet(cacheKey);

    if (cached) {
        return res.json(cached);
    }

    const [totalProducts, avgDiscount, topCategories] = await Promise.all([
        Product.countDocuments({ isActive: true }),
        Product.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: null, avgDiscount: { $avg: '$discountPercentage' } } }
        ]),
        Product.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$category', count: { $sum: 1 }, avgDiscount: { $avg: '$discountPercentage' } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ])
    ]);

    const response = {
        success: true,
        data: {
            totalProducts,
            averageDiscount: avgDiscount[0]?.avgDiscount?.toFixed(1) || 0,
            topCategories
        }
    };

    // Cache for 30 minutes
    await cacheSet(cacheKey, response, 1800);

    res.json(response);
}));

// Search products (static route before dynamic)
router.get('/search/:query', asyncHandler(async (req, res) => {
    const { query } = req.params;
    const { limit = 20 } = req.query;

    const products = await Product.find(
        { $text: { $search: query }, isActive: true },
        { score: { $meta: 'textScore' } }
    )
        .sort({ score: { $meta: 'textScore' } })
        .limit(parseInt(limit))
        .lean();

    res.json({ success: true, data: products });
}));

// Get all products with filters
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        category,
        minDiscount,
        maxPrice,
        minPrice,
        minRating,
        sortBy = 'dealScore',
        sortOrder = 'desc',
        search
    } = req.query;

    // Build cache key
    const cacheKey = `products:list:${JSON.stringify(req.query)}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
        return res.json(cached);
    }

    // Build query
    const query = { isActive: true };

    if (category) {
        query.category = category;
    }

    if (minDiscount) {
        query.discountPercentage = { $gte: parseInt(minDiscount) };
    }

    if (minPrice || maxPrice) {
        query.discountedPrice = {};
        if (minPrice) query.discountedPrice.$gte = parseFloat(minPrice);
        if (maxPrice) query.discountedPrice.$lte = parseFloat(maxPrice);
    }

    if (minRating) {
        query.rating = { $gte: parseFloat(minRating) };
    }

    if (search) {
        query.$text = { $search: search };
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
        Product.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
        Product.countDocuments(query)
    ]);

    const response = {
        success: true,
        data: products,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    };

    // Cache for 5 minutes
    await cacheSet(cacheKey, response, 300);

    res.json(response);
}));

// Get product by ID or ASIN - MUST be LAST (dynamic route)
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const cacheKey = `products:${id}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
        return res.json(cached);
    }

    // Try by ASIN first, then by MongoDB ID
    let product = await Product.findOne({ asin: id }).lean();

    if (!product) {
        product = await Product.findById(id).lean();
    }

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    const response = { success: true, data: product };

    // Cache for 15 minutes
    await cacheSet(cacheKey, response, 900);

    res.json(response);
}));

// Get price history for a product
router.get('/:id/price-history', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { days = 30 } = req.query;

    const product = await Product.findOne({ asin: id }).select('priceHistory title asin').lean();

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    // Filter price history by days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const filteredHistory = product.priceHistory.filter(
        p => new Date(p.date) >= cutoffDate
    );

    res.json({
        success: true,
        data: {
            asin: product.asin,
            title: product.title,
            priceHistory: filteredHistory
        }
    });
}));

// ============================================
// MANUAL PRODUCT MANAGEMENT (Admin Endpoints)
// ============================================

// Create a new product manually (Admin only)
router.post('/', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const {
        asin,
        title,
        description,
        imageUrl,
        originalPrice,
        discountedPrice,
        category,
        rating,
        reviewCount,
        affiliateLink,
        brand,
        features
    } = req.body;

    // Validation
    if (!asin || !title || !imageUrl || !originalPrice || !discountedPrice || !category) {
        return res.status(400).json({
            success: false,
            message: 'Required fields: asin, title, imageUrl, originalPrice, discountedPrice, category'
        });
    }

    // Check if product already exists
    const existingProduct = await Product.findOne({ asin });
    if (existingProduct) {
        return res.status(400).json({
            success: false,
            message: 'Product with this ASIN already exists'
        });
    }

    // Calculate discount percentage
    const discountPercentage = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);

    const product = new Product({
        asin,
        title,
        description: description || '',
        imageUrl,
        originalPrice,
        discountedPrice,
        discountPercentage,
        category,
        rating: rating || 0,
        reviewCount: reviewCount || 0,
        affiliateLink: affiliateLink || `https://www.amazon.it/dp/${asin}`,
        brand: brand || '',
        features: features || [],
        priceHistory: [{ price: discountedPrice, date: new Date() }],
        isActive: true
    });

    await product.save();

    // Auto-post to social media (Telegram, etc.)
    try {
        const shareResult = await socialService.shareProduct(product, 'new_deal', ['telegram']);
        console.log('Social share result:', shareResult);
    } catch (shareError) {
        console.error('Social share error (non-blocking):', shareError.message);
    }

    res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
    });
}));

// Update a product (Admin only)
router.put('/:id', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Find product by ASIN or MongoDB ID
    let product = await Product.findOne({ asin: id });
    if (!product) {
        product = await Product.findById(id);
    }

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    // If price is being updated, add to price history
    if (updates.discountedPrice && updates.discountedPrice !== product.discountedPrice) {
        product.priceHistory.push({
            price: updates.discountedPrice,
            date: new Date()
        });
    }

    // Recalculate discount percentage if prices changed
    if (updates.originalPrice || updates.discountedPrice) {
        const origPrice = updates.originalPrice || product.originalPrice;
        const discPrice = updates.discountedPrice || product.discountedPrice;
        updates.discountPercentage = Math.round(((origPrice - discPrice) / origPrice) * 100);
    }

    // Update fields
    Object.assign(product, updates);
    product.lastUpdated = new Date();

    await product.save();

    res.json({
        success: true,
        message: 'Product updated successfully',
        data: product
    });
}));

// Delete a product (Admin only)
router.delete('/:id', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Find and delete by ASIN or MongoDB ID
    let product = await Product.findOneAndDelete({ asin: id });
    if (!product) {
        product = await Product.findByIdAndDelete(id);
    }

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    res.json({
        success: true,
        message: 'Product deleted successfully'
    });
}));

export default router;
