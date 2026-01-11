import { Router } from 'express';
import { asyncHandler, authenticate } from '../middleware/index.js';
import { scheduler } from '../services/amazon/index.js';
import { socialService } from '../services/social/index.js';
import { notificationService } from '../services/notifications/index.js';

const router = Router();

// Get VAPID public key for push subscriptions
router.get('/push/vapid-key', (req, res) => {
    const publicKey = notificationService.getPublicVapidKey();

    if (!publicKey) {
        return res.status(503).json({
            success: false,
            message: 'Push notifications not configured'
        });
    }

    res.json({
        success: true,
        data: { publicKey }
    });
});

// Admin: Trigger manual sync
router.post('/admin/sync', authenticate, asyncHandler(async (req, res) => {
    // In production, add admin role check here

    const stats = await scheduler.triggerSync();

    res.json({
        success: true,
        message: 'Sync job triggered',
        data: stats
    });
}));

// Admin: Share daily deals to social media
router.post('/admin/share-daily', authenticate, asyncHandler(async (req, res) => {
    const { limit = 5 } = req.body;

    const results = await socialService.shareDailyTopDeals(limit);

    res.json({
        success: true,
        message: 'Daily deals shared',
        data: results
    });
}));

// Admin: Get sharing statistics
router.get('/admin/sharing-stats', authenticate, asyncHandler(async (req, res) => {
    const stats = await socialService.getSharingStats();

    res.json({
        success: true,
        data: stats
    });
}));

// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

export default router;
