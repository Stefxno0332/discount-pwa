import telegramService from './telegramService.js';
import redditService from './redditService.js';
import metaService from './metaService.js';
import twitterService from './twitterService.js';
import { Product } from '../../models/index.js';

// Share product to all configured platforms
export const shareProduct = async (product, type = 'deal', platforms = null) => {
    const results = {
        telegram: null,
        reddit: null,
        facebook: null,
        instagram: null,
        twitter: null
    };

    const targetPlatforms = platforms || ['telegram', 'reddit', 'facebook', 'instagram', 'twitter'];

    try {
        // Telegram
        if (targetPlatforms.includes('telegram')) {
            results.telegram = await telegramService.postToChannel(product, type);

            if (results.telegram.success) {
                await updateSharedStatus(product.asin, 'telegram');
            }
        }

        // Reddit
        if (targetPlatforms.includes('reddit')) {
            results.reddit = await redditService.postToSubreddit(product, 'DealsItalia', type);

            if (results.reddit.success) {
                await updateSharedStatus(product.asin, 'reddit');
            }
        }

        // Facebook
        if (targetPlatforms.includes('facebook')) {
            results.facebook = await metaService.postToFacebook(product, type);

            if (results.facebook.success) {
                await updateSharedStatus(product.asin, 'facebook');
            }
        }

        // Instagram
        if (targetPlatforms.includes('instagram')) {
            results.instagram = await metaService.postToInstagram(product, type);

            if (results.instagram.success) {
                await updateSharedStatus(product.asin, 'instagram');
            }
        }

        // Twitter
        if (targetPlatforms.includes('twitter')) {
            results.twitter = await twitterService.postTweet(product, type);

            if (results.twitter.success) {
                await updateSharedStatus(product.asin, 'twitter');
            }
        }

        // Summary
        const successful = Object.values(results).filter(r => r && r.success).length;
        const failed = Object.values(results).filter(r => r && !r.success).length;

        console.log(`Product ${product.asin} shared: ${successful} success, ${failed} failed`);

        return {
            success: successful > 0,
            results,
            summary: { successful, failed }
        };
    } catch (error) {
        console.error('Error sharing product:', error);
        return {
            success: false,
            error: error.message,
            results
        };
    }
};

// Share daily top deals to all platforms
export const shareDailyTopDeals = async (limit = 5) => {
    try {
        // Get top deals not yet shared
        const topDeals = await Product.find({
            isActive: true,
            discountPercentage: { $gte: 30 },
            $or: [
                { 'sharedTo.telegram': false },
                { 'sharedTo.twitter': false }
            ]
        })
            .sort({ dealScore: -1 })
            .limit(limit);

        if (topDeals.length === 0) {
            console.log('No new deals to share');
            return { success: true, message: 'No new deals to share' };
        }

        const results = {
            telegram: null,
            twitter: null,
            instagram: null,
            individual: []
        };

        // Post album to Telegram
        results.telegram = await telegramService.postProductAlbum(topDeals, 'Top Offerte del Giorno');

        // Post thread to Twitter
        results.twitter = await twitterService.postThread(topDeals, 'Top Offerte del Giorno');

        // Post carousel to Instagram
        results.instagram = await metaService.postCarouselToInstagram(topDeals);

        // Share individually to Reddit (separate posts)
        for (const deal of topDeals.slice(0, 3)) {
            const redditResult = await redditService.postToSubreddit(deal, 'DealsItalia');
            results.individual.push({ asin: deal.asin, reddit: redditResult });

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        return {
            success: true,
            results,
            dealsShared: topDeals.length
        };
    } catch (error) {
        console.error('Error sharing daily deals:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Update product's shared status
const updateSharedStatus = async (asin, platform) => {
    try {
        await Product.updateOne(
            { asin },
            { $set: { [`sharedTo.${platform}`]: true } }
        );
    } catch (error) {
        console.error(`Error updating shared status for ${asin}:`, error);
    }
};

// Get sharing statistics
export const getSharingStats = async () => {
    try {
        const stats = await Product.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    sharedToTelegram: { $sum: { $cond: ['$sharedTo.telegram', 1, 0] } },
                    sharedToReddit: { $sum: { $cond: ['$sharedTo.reddit', 1, 0] } },
                    sharedToTwitter: { $sum: { $cond: ['$sharedTo.twitter', 1, 0] } },
                    sharedToFacebook: { $sum: { $cond: ['$sharedTo.facebook', 1, 0] } },
                    sharedToInstagram: { $sum: { $cond: ['$sharedTo.instagram', 1, 0] } }
                }
            }
        ]);

        return stats[0] || {
            total: 0,
            sharedToTelegram: 0,
            sharedToReddit: 0,
            sharedToTwitter: 0,
            sharedToFacebook: 0,
            sharedToInstagram: 0
        };
    } catch (error) {
        console.error('Error getting sharing stats:', error);
        return null;
    }
};

export default {
    shareProduct,
    shareDailyTopDeals,
    getSharingStats
};
