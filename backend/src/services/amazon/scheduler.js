import cron from 'node-cron';
import amazonService from './amazonService.js';
import { Product } from '../../models/index.js';
import notificationService from '../notifications/notificationService.js';
import socialService from '../social/socialService.js';

// Categories to scan for deals
const categoriesToScan = [
    { name: 'Electronics', keywords: 'elettronica offerte' },
    { name: 'Computers', keywords: 'computer offerte' },
    { name: 'HomeAndGarden', keywords: 'casa giardino offerte' },
    { name: 'Kitchen', keywords: 'cucina offerte' },
    { name: 'Fashion', keywords: 'moda offerte' },
    { name: 'Beauty', keywords: 'bellezza offerte' },
    { name: 'Sports', keywords: 'sport offerte' },
    { name: 'VideoGames', keywords: 'videogiochi offerte' }
];

let isRunning = false;

// Main sync job
export const runDealsSyncJob = async () => {
    if (isRunning) {
        console.log('Deals sync already running, skipping...');
        return;
    }

    isRunning = true;
    console.log(`[${new Date().toISOString()}] Starting deals sync job...`);

    const stats = {
        totalProducts: 0,
        newProducts: 0,
        updatedProducts: 0,
        priceDrops: 0,
        errors: 0
    };

    try {
        for (const category of categoriesToScan) {
            console.log(`Scanning category: ${category.name}`);

            try {
                // Search for deals in this category
                const result = await amazonService.searchDeals({
                    searchIndex: amazonService.AMAZON_CATEGORIES[category.name] || 'All',
                    keywords: category.keywords,
                    minDiscount: 15 // Only products with at least 15% discount
                });

                if (result.products.length > 0) {
                    // Check for price drops before syncing
                    for (const product of result.products) {
                        const existing = await Product.findOne({ asin: product.asin });

                        if (existing && existing.discountedPrice > product.discountedPrice) {
                            // Price dropped!
                            stats.priceDrops++;

                            // Notify users watching this product
                            await notificationService.notifyPriceDrop(existing, product.discountedPrice);

                            // Share significant price drops to social media
                            if (product.discountPercentage >= 30) {
                                await socialService.shareProduct(product, 'price_drop');
                            }
                        }
                    }

                    // Sync to database
                    const syncResult = await amazonService.syncProductsToDatabase(result.products);

                    stats.totalProducts += result.products.length;
                    stats.newProducts += syncResult.created;
                    stats.updatedProducts += syncResult.updated;
                    stats.errors += syncResult.errors;
                }

                // Respect rate limits - wait between category requests
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
                console.error(`Error scanning category ${category.name}:`, error.message);
                stats.errors++;
            }
        }

        // Mark products not updated in 7 days as inactive
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        await Product.updateMany(
            { lastUpdated: { $lt: sevenDaysAgo }, isActive: true },
            { $set: { isActive: false } }
        );

        console.log(`[${new Date().toISOString()}] Deals sync completed:`, stats);

    } catch (error) {
        console.error('Deals sync job error:', error);
    } finally {
        isRunning = false;
    }

    return stats;
};

// Schedule the job to run every 6 hours
export const startScheduler = () => {
    // Run at 00:00, 06:00, 12:00, 18:00
    cron.schedule('0 */6 * * *', runDealsSyncJob, {
        timezone: 'Europe/Rome'
    });

    console.log('Deals sync scheduler started (every 6 hours)');

    // Also run immediately on startup (after a delay)
    setTimeout(() => {
        console.log('Running initial deals sync...');
        runDealsSyncJob();
    }, 10000); // Wait 10 seconds after startup
};

// Manual trigger
export const triggerSync = async () => {
    return await runDealsSyncJob();
};

export default {
    startScheduler,
    triggerSync,
    runDealsSyncJob
};
