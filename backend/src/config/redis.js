import Redis from 'ioredis';
import config from './env.js';

let redis = null;

const connectRedis = async () => {
    // Skip Redis if URL not provided (e.g., Render free tier)
    if (!config.redis.url || config.redis.url === '') {
        console.log('Redis URL not configured, running without cache');
        return null;
    }

    try {
        redis = new Redis(config.redis.url, {
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 100,
            lazyConnect: true,
            enableOfflineQueue: false
        });

        await redis.connect();
        console.log('Redis Connected');

        redis.on('error', (err) => {
            console.error('Redis connection error:', err.message);
        });

        redis.on('reconnecting', () => {
            console.log('Redis reconnecting...');
        });

        return redis;
    } catch (error) {
        console.warn('Redis connection failed, continuing without cache:', error.message);
        redis = null;
        return null;
    }
};

// Cache helpers
export const cacheGet = async (key) => {
    if (!redis) return null;
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Cache get error:', error);
        return null;
    }
};

export const cacheSet = async (key, value, ttlSeconds = 3600) => {
    if (!redis) return false;
    try {
        await redis.setex(key, ttlSeconds, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Cache set error:', error);
        return false;
    }
};

export const cacheDelete = async (key) => {
    if (!redis) return false;
    try {
        await redis.del(key);
        return true;
    } catch (error) {
        console.error('Cache delete error:', error);
        return false;
    }
};

export const cacheFlush = async (pattern) => {
    if (!redis) return false;
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
        return true;
    } catch (error) {
        console.error('Cache flush error:', error);
        return false;
    }
};

export { redis };
export default connectRedis;
