import { User } from '../../models/index.js';
import pushService from './pushService.js';
import whatsappService from './whatsappService.js';

// Notify users about a price drop on a watched product
export const notifyPriceDrop = async (product, newPrice) => {
    try {
        // Find users who have this product in their watchlist
        const users = await User.find({
            watchlist: product._id,
            isActive: true
        });

        const results = {
            push: { sent: 0, failed: 0 },
            whatsapp: { sent: 0, failed: 0 }
        };

        for (const user of users) {
            // Send push notification
            if (user.notifications?.push?.enabled && user.notifications?.push?.subscription) {
                const payload = pushService.createPriceDropNotification(
                    product,
                    product.discountedPrice,
                    newPrice
                );

                const pushResult = await pushService.sendPushNotification(
                    user.notifications.push.subscription,
                    payload
                );

                if (pushResult === true) {
                    results.push.sent++;
                } else {
                    results.push.failed++;

                    // Remove expired subscription
                    if (pushResult && pushResult.expired) {
                        user.notifications.push.enabled = false;
                        user.notifications.push.subscription = null;
                        await user.save();
                    }
                }
            }

            // Send WhatsApp notification
            if (user.notifications?.whatsapp?.enabled && user.notifications?.whatsapp?.phone) {
                const whatsappResult = await whatsappService.sendPriceDropNotification(
                    user.notifications.whatsapp.phone,
                    product,
                    product.discountedPrice
                );

                if (whatsappResult.success) {
                    results.whatsapp.sent++;
                } else {
                    results.whatsapp.failed++;
                }
            }
        }

        console.log(`Price drop notifications sent for ${product.asin}:`, results);
        return results;
    } catch (error) {
        console.error('Error sending price drop notifications:', error);
        throw error;
    }
};

// Notify users about new deals in their watched categories
export const notifyNewCategoryDeals = async (products, category) => {
    try {
        // Find users watching this category
        const users = await User.find({
            watchCategories: category,
            isActive: true
        });

        const results = {
            push: { sent: 0, failed: 0 },
            whatsapp: { sent: 0, failed: 0 }
        };

        // Get the best deal to notify about
        const bestDeal = products.reduce((best, current) =>
            current.discountPercentage > best.discountPercentage ? current : best
        );

        for (const user of users) {
            // Check if deal meets user's minimum discount preference
            if (user.preferences?.minDiscountPercent &&
                bestDeal.discountPercentage < user.preferences.minDiscountPercent) {
                continue;
            }

            // Send push notification
            if (user.notifications?.push?.enabled && user.notifications?.push?.subscription) {
                const payload = {
                    title: `🛒 Nuove offerte in ${category}!`,
                    body: `${products.length} nuovi sconti, fino al ${bestDeal.discountPercentage}% di sconto`,
                    url: `/category/${encodeURIComponent(category)}`,
                    type: 'category_deals'
                };

                const pushResult = await pushService.sendPushNotification(
                    user.notifications.push.subscription,
                    payload
                );

                if (pushResult === true) {
                    results.push.sent++;
                } else {
                    results.push.failed++;
                }
            }
        }

        return results;
    } catch (error) {
        console.error('Error sending category deal notifications:', error);
        throw error;
    }
};

// Notify specific user about their watchlist item
export const notifyUserAboutDeal = async (userId, product) => {
    try {
        const user = await User.findById(userId);

        if (!user || !user.isActive) {
            return { success: false, error: 'User not found' };
        }

        const results = { push: false, whatsapp: false };

        // Push notification
        if (user.notifications?.push?.enabled && user.notifications?.push?.subscription) {
            const payload = pushService.createWatchlistNotification(product);
            results.push = await pushService.sendPushNotification(
                user.notifications.push.subscription,
                payload
            );
        }

        // WhatsApp notification
        if (user.notifications?.whatsapp?.enabled && user.notifications?.whatsapp?.phone) {
            const whatsappResult = await whatsappService.sendDealNotification(
                user.notifications.whatsapp.phone,
                product
            );
            results.whatsapp = whatsappResult.success;
        }

        return { success: true, results };
    } catch (error) {
        console.error('Error notifying user:', error);
        return { success: false, error: error.message };
    }
};

// Get VAPID public key for frontend
export const getPublicVapidKey = () => {
    return pushService.getVapidPublicKey();
};

export default {
    notifyPriceDrop,
    notifyNewCategoryDeals,
    notifyUserAboutDeal,
    getPublicVapidKey
};
