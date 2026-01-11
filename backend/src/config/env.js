import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET'
];

const optionalEnvVars = [
    'AMAZON_ACCESS_KEY',
    'AMAZON_SECRET_KEY',
    'AMAZON_PARTNER_TAG'
];

// Check required environment variables
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missingVars.join(', ')}`);
}

export default {
    // Server
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3001,

    // Database
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/amazon-discount-pwa'
    },

    // Redis (optional - leave empty to disable)
    redis: {
        url: process.env.REDIS_URL || ''
    },

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'fallback-secret-change-me',
        expiresIn: '7d'
    },

    // Amazon PA-API
    amazon: {
        accessKey: process.env.AMAZON_ACCESS_KEY,
        secretKey: process.env.AMAZON_SECRET_KEY,
        partnerTag: process.env.AMAZON_PARTNER_TAG,
        marketplace: process.env.AMAZON_MARKETPLACE || 'www.amazon.it',
        region: 'eu-west-1'
    },

    // Web Push
    vapid: {
        publicKey: process.env.VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_PRIVATE_KEY,
        subject: process.env.VAPID_SUBJECT
    },

    // Twilio
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER
    },

    // Telegram
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        channelId: process.env.TELEGRAM_CHANNEL_ID
    },

    // Reddit
    reddit: {
        clientId: process.env.REDDIT_CLIENT_ID,
        clientSecret: process.env.REDDIT_CLIENT_SECRET,
        username: process.env.REDDIT_USERNAME,
        password: process.env.REDDIT_PASSWORD,
        userAgent: process.env.REDDIT_USER_AGENT || 'AmazonDiscountBot/1.0'
    },

    // Meta (Facebook/Instagram)
    meta: {
        appId: process.env.META_APP_ID,
        appSecret: process.env.META_APP_SECRET,
        accessToken: process.env.META_ACCESS_TOKEN,
        pageId: process.env.META_PAGE_ID,
        instagramAccountId: process.env.META_INSTAGRAM_ACCOUNT_ID
    },

    // Twitter
    twitter: {
        apiKey: process.env.TWITTER_API_KEY,
        apiSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_SECRET
    },

    // CORS
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
};
