import webpush from 'web-push';
import config from '../../config/env.js';

// Configure VAPID keys (optional - push notifications won't work without valid keys)
try {
    if (config.vapid.publicKey && config.vapid.privateKey && config.vapid.subject) {
        webpush.setVapidDetails(
            config.vapid.subject,
            config.vapid.publicKey,
            config.vapid.privateKey
        );
        console.log('Push notifications configured');
    } else {
        console.warn('VAPID keys not configured, push notifications disabled');
    }
} catch (error) {
    console.warn('Failed to configure push notifications:', error.message);
}

// Send push notification to a single subscription
export const sendPushNotification = async (subscription, payload) => {
    if (!subscription || !subscription.endpoint) {
        console.warn('Invalid push subscription');
        return false;
    }

    try {
        const notificationPayload = JSON.stringify({
            title: payload.title || 'Amazon Discount Alert',
            body: payload.body || '',
            icon: payload.icon || '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            image: payload.image || null,
            data: {
                url: payload.url || '/',
                productId: payload.productId || null,
                type: payload.type || 'deal'
            },
            actions: payload.actions || [
                { action: 'view', title: 'Vedi Offerta' },
                { action: 'dismiss', title: 'Ignora' }
            ],
            vibrate: [100, 50, 100],
            tag: payload.tag || `deal-${Date.now()}`,
            renotify: true,
            requireInteraction: payload.requireInteraction || false
        });

        await webpush.sendNotification(subscription, notificationPayload);
        return true;
    } catch (error) {
        if (error.statusCode === 410 || error.statusCode === 404) {
            // Subscription expired or invalid
            console.log('Push subscription expired, should be removed');
            return { expired: true };
        }
        console.error('Push notification error:', error);
        return false;
    }
};

// Send push to multiple subscriptions
export const sendPushToMany = async (subscriptions, payload) => {
    const results = {
        sent: 0,
        failed: 0,
        expired: []
    };

    for (const sub of subscriptions) {
        const result = await sendPushNotification(sub, payload);

        if (result === true) {
            results.sent++;
        } else if (result && result.expired) {
            results.expired.push(sub.endpoint);
        } else {
            results.failed++;
        }
    }

    return results;
};

// Create notification payloads for different events
export const createDealNotification = (product) => ({
    title: `🔥 Sconto ${product.discountPercentage}%!`,
    body: `${product.title.substring(0, 60)}... ora a €${product.discountedPrice.toFixed(2)}`,
    image: product.imageUrl,
    url: `/product/${product.asin}`,
    productId: product.asin,
    type: 'deal',
    tag: `deal-${product.asin}`
});

export const createPriceDropNotification = (product, oldPrice, newPrice) => ({
    title: `📉 Prezzo diminuito!`,
    body: `${product.title.substring(0, 50)}... da €${oldPrice.toFixed(2)} a €${newPrice.toFixed(2)}`,
    image: product.imageUrl,
    url: `/product/${product.asin}`,
    productId: product.asin,
    type: 'price_drop',
    tag: `pricedrop-${product.asin}`,
    requireInteraction: true
});

export const createWatchlistNotification = (product) => ({
    title: `⭐ Prodotto in watchlist scontato!`,
    body: `${product.title.substring(0, 60)}... scontato del ${product.discountPercentage}%`,
    image: product.imageUrl,
    url: `/product/${product.asin}`,
    productId: product.asin,
    type: 'watchlist',
    tag: `watchlist-${product.asin}`,
    requireInteraction: true
});

// Get VAPID public key for client subscription
export const getVapidPublicKey = () => config.vapid.publicKey;

export default {
    sendPushNotification,
    sendPushToMany,
    createDealNotification,
    createPriceDropNotification,
    createWatchlistNotification,
    getVapidPublicKey
};
