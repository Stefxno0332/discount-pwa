import api from './api';

// Get VAPID public key
export const getVapidPublicKey = async () => {
    const response = await api.get('/push/vapid-key');
    return response.data.data.publicKey;
};

// Subscribe to push notifications
export const subscribeToPush = async () => {
    try {
        // Check if push is supported
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            throw new Error('Push notifications not supported');
        }

        // Get VAPID key
        const publicKey = await getVapidPublicKey();

        // Get service worker registration
        const registration = await navigator.serviceWorker.ready;

        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
        });

        // Send subscription to backend
        await api.post('/users/notifications/push/subscribe', { subscription });

        return { success: true };
    } catch (error) {
        console.error('Push subscription error:', error);
        return { success: false, error: error.message };
    }
};

// Unsubscribe from push notifications
export const unsubscribeFromPush = async () => {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();
        }

        await api.post('/users/notifications/push/unsubscribe');

        return { success: true };
    } catch (error) {
        console.error('Push unsubscribe error:', error);
        return { success: false, error: error.message };
    }
};

// Check if push is subscribed
export const isPushSubscribed = async () => {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        return subscription !== null;
    } catch {
        return false;
    }
};

// Request notification permission
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        return 'denied';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission === 'denied') {
        return 'denied';
    }

    return await Notification.requestPermission();
};

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

export default {
    subscribeToPush,
    unsubscribeFromPush,
    isPushSubscribed,
    requestNotificationPermission
};
