import mongoose from 'mongoose';

const priceHistorySchema = new mongoose.Schema({
    price: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const productSchema = new mongoose.Schema({
    asin: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    imageUrl: {
        type: String,
        required: true
    },
    originalPrice: {
        type: Number,
        required: true
    },
    discountedPrice: {
        type: Number,
        required: true
    },
    discountPercentage: {
        type: Number,
        required: true,
        index: true
    },
    category: {
        type: String,
        required: true,
        index: true
    },
    categoryPath: [{
        type: String
    }],
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    affiliateLink: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        default: ''
    },
    features: [{
        type: String
    }],
    priceHistory: [priceHistorySchema],
    lowestPrice: {
        type: Number,
        default: null
    },
    highestPrice: {
        type: Number,
        default: null
    },
    averagePrice: {
        type: Number,
        default: null
    },
    dealScore: {
        type: Number,
        default: 0,
        index: true
    },
    dealBadge: {
        type: String,
        enum: ['best_deal', 'biggest_discount', 'most_popular', 'price_drop', null],
        default: null
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    sharedTo: {
        telegram: { type: Boolean, default: false },
        reddit: { type: Boolean, default: false },
        twitter: { type: Boolean, default: false },
        facebook: { type: Boolean, default: false },
        instagram: { type: Boolean, default: false }
    }
}, {
    timestamps: true
});

// Calculate deal score before saving
productSchema.pre('save', function (next) {
    // Deal score formula: weighted combination of discount %, rating, and review count
    const discountWeight = 0.5;
    const ratingWeight = 0.3;
    const popularityWeight = 0.2;

    const normalizedDiscount = Math.min(this.discountPercentage / 100, 1);
    const normalizedRating = this.rating / 5;
    const normalizedPopularity = Math.min(Math.log10(this.reviewCount + 1) / 5, 1);

    this.dealScore = (
        normalizedDiscount * discountWeight +
        normalizedRating * ratingWeight +
        normalizedPopularity * popularityWeight
    ) * 100;

    // Update price statistics
    if (this.priceHistory.length > 0) {
        const prices = this.priceHistory.map(p => p.price);
        this.lowestPrice = Math.min(...prices);
        this.highestPrice = Math.max(...prices);
        this.averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    }

    // Assign deal badge
    if (this.discountPercentage >= 50) {
        this.dealBadge = 'biggest_discount';
    } else if (this.dealScore >= 70) {
        this.dealBadge = 'best_deal';
    } else if (this.reviewCount >= 1000) {
        this.dealBadge = 'most_popular';
    }

    next();
});

// Text search index
productSchema.index({ title: 'text', description: 'text', brand: 'text' });

// Compound indexes for common queries
productSchema.index({ category: 1, discountPercentage: -1 });
productSchema.index({ isActive: 1, dealScore: -1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
