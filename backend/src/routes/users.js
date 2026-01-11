import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User, Product } from '../models/index.js';
import { authenticate, asyncHandler } from '../middleware/index.js';
import config from '../config/env.js';
import { whatsappService } from '../services/notifications/index.js';

const router = Router();

// Register new user
router.post('/register', asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({
            success: false,
            message: 'Email, password, and name are required'
        });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'Email already registered'
        });
    }

    // Create user
    const user = new User({
        email,
        password,
        name
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
        { userId: user._id },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );

    res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
            user: user.toJSON(),
            token
        }
    });
}));

// Login
router.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    // Find user with password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign(
        { userId: user._id },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: user.toJSON(),
            token
        }
    });
}));

// Get current user profile
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId)
        .populate('watchlist', 'asin title imageUrl discountedPrice discountPercentage');

    res.json({
        success: true,
        data: user
    });
}));

// Update user profile
router.put('/profile', authenticate, asyncHandler(async (req, res) => {
    const { name, preferences } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (preferences) updates.preferences = preferences;

    const user = await User.findByIdAndUpdate(
        req.userId,
        { $set: updates },
        { new: true }
    );

    res.json({
        success: true,
        message: 'Profile updated',
        data: user
    });
}));

// Get watchlist
router.get('/watchlist', authenticate, asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId)
        .populate('watchlist');

    res.json({
        success: true,
        data: user.watchlist
    });
}));

// Add product to watchlist
router.post('/watchlist/:productId', authenticate, asyncHandler(async (req, res) => {
    const { productId } = req.params;

    // Find product by ASIN or ID
    const product = await Product.findOne({
        $or: [{ asin: productId }, { _id: productId }]
    });

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    // Add to watchlist if not already there
    const user = await User.findById(req.userId);

    if (user.watchlist.includes(product._id)) {
        return res.status(400).json({
            success: false,
            message: 'Product already in watchlist'
        });
    }

    user.watchlist.push(product._id);
    await user.save();

    res.json({
        success: true,
        message: 'Product added to watchlist',
        data: { productId: product._id }
    });
}));

// Remove product from watchlist
router.delete('/watchlist/:productId', authenticate, asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findOne({
        $or: [{ asin: productId }, { _id: productId }]
    });

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    await User.findByIdAndUpdate(req.userId, {
        $pull: { watchlist: product._id }
    });

    res.json({
        success: true,
        message: 'Product removed from watchlist'
    });
}));

// Add category to watch
router.post('/watch-categories', authenticate, asyncHandler(async (req, res) => {
    const { category } = req.body;

    if (!category) {
        return res.status(400).json({
            success: false,
            message: 'Category is required'
        });
    }

    await User.findByIdAndUpdate(req.userId, {
        $addToSet: { watchCategories: category }
    });

    res.json({
        success: true,
        message: 'Category added to watch list'
    });
}));

// Remove category from watch
router.delete('/watch-categories/:category', authenticate, asyncHandler(async (req, res) => {
    const { category } = req.params;

    await User.findByIdAndUpdate(req.userId, {
        $pull: { watchCategories: category }
    });

    res.json({
        success: true,
        message: 'Category removed from watch list'
    });
}));

// Update notification settings
router.put('/notifications', authenticate, asyncHandler(async (req, res) => {
    const { push, whatsapp, email } = req.body;

    const updates = {};

    if (push !== undefined) {
        updates['notifications.push'] = push;
    }

    if (whatsapp !== undefined) {
        // Validate phone number if enabling WhatsApp
        if (whatsapp.enabled && whatsapp.phone) {
            if (!whatsappService.isValidPhoneNumber(whatsapp.phone)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid phone number format. Use international format (e.g., +39123456789)'
                });
            }
        }
        updates['notifications.whatsapp'] = whatsapp;
    }

    if (email !== undefined) {
        updates['notifications.email'] = email;
    }

    const user = await User.findByIdAndUpdate(
        req.userId,
        { $set: updates },
        { new: true }
    );

    res.json({
        success: true,
        message: 'Notification settings updated',
        data: user.notifications
    });
}));

// Subscribe to push notifications
router.post('/notifications/push/subscribe', authenticate, asyncHandler(async (req, res) => {
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint) {
        return res.status(400).json({
            success: false,
            message: 'Invalid push subscription'
        });
    }

    await User.findByIdAndUpdate(req.userId, {
        $set: {
            'notifications.push.enabled': true,
            'notifications.push.subscription': subscription
        }
    });

    res.json({
        success: true,
        message: 'Push notifications enabled'
    });
}));

// Unsubscribe from push notifications
router.post('/notifications/push/unsubscribe', authenticate, asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.userId, {
        $set: {
            'notifications.push.enabled': false,
            'notifications.push.subscription': null
        }
    });

    res.json({
        success: true,
        message: 'Push notifications disabled'
    });
}));

// Get compare list
router.get('/compare', authenticate, asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId)
        .populate('compareList');

    res.json({
        success: true,
        data: user.compareList
    });
}));

// Add product to compare list
router.post('/compare/:productId', authenticate, asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findOne({
        $or: [{ asin: productId }, { _id: productId }]
    });

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    const user = await User.findById(req.userId);

    if (user.compareList.length >= 4) {
        return res.status(400).json({
            success: false,
            message: 'Compare list is full (max 4 products)'
        });
    }

    if (user.compareList.includes(product._id)) {
        return res.status(400).json({
            success: false,
            message: 'Product already in compare list'
        });
    }

    user.compareList.push(product._id);
    await user.save();

    res.json({
        success: true,
        message: 'Product added to compare list'
    });
}));

// Remove product from compare list
router.delete('/compare/:productId', authenticate, asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findOne({
        $or: [{ asin: productId }, { _id: productId }]
    });

    if (product) {
        await User.findByIdAndUpdate(req.userId, {
            $pull: { compareList: product._id }
        });
    }

    res.json({
        success: true,
        message: 'Product removed from compare list'
    });
}));

// Clear compare list
router.delete('/compare', authenticate, asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.userId, {
        $set: { compareList: [] }
    });

    res.json({
        success: true,
        message: 'Compare list cleared'
    });
}));

export default router;
