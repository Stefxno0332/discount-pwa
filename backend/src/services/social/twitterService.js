import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';
import config from '../../config/env.js';

let client = null;

// Initialize Twitter client
const getClient = () => {
    if (!client && config.twitter.apiKey && config.twitter.apiSecret) {
        client = new TwitterApi({
            appKey: config.twitter.apiKey,
            appSecret: config.twitter.apiSecret,
            accessToken: config.twitter.accessToken,
            accessSecret: config.twitter.accessSecret
        });
    }
    return client;
};

// Format tweet message
const formatTweet = (product, type = 'deal') => {
    const emoji = type === 'price_drop' ? '📉' : '🔥';

    // Twitter limit is 280 characters
    const maxLength = 250; // Leave room for link

    let tweet = `${emoji} `;
    tweet += type === 'price_drop' ? 'PREZZO GIÙ! ' : 'OFFERTA! ';

    // Truncate title if needed
    const priceInfo = `€${product.discountedPrice.toFixed(2)} (-${product.discountPercentage}%)`;
    const hashtags = '\n\n#AmazonDeals #Sconti';

    const availableForTitle = maxLength - tweet.length - priceInfo.length - hashtags.length - 5;

    if (product.title.length > availableForTitle) {
        tweet += product.title.substring(0, availableForTitle - 3) + '...';
    } else {
        tweet += product.title;
    }

    tweet += `\n\n💰 ${priceInfo}`;
    tweet += hashtags;

    return tweet;
};

// Download image for upload to Twitter
const downloadImage = async (url) => {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    } catch (error) {
        console.error('Error downloading image:', error);
        return null;
    }
};

// Post tweet with optional image
export const postTweet = async (product, type = 'deal') => {
    const twitterClient = getClient();

    if (!twitterClient) {
        console.warn('Twitter not configured');
        return { success: false, error: 'Twitter not configured' };
    }

    try {
        const tweetText = formatTweet(product, type);

        let mediaId = null;

        // Upload image if available
        if (product.imageUrl) {
            const imageBuffer = await downloadImage(product.imageUrl);

            if (imageBuffer) {
                const uploadClient = twitterClient.readWrite;
                mediaId = await uploadClient.v1.uploadMedia(imageBuffer, {
                    mimeType: 'image/jpeg'
                });
            }
        }

        // Post tweet
        const tweetOptions = {};
        if (mediaId) {
            tweetOptions.media = { media_ids: [mediaId] };
        }

        const tweet = await twitterClient.v2.tweet(tweetText, tweetOptions);

        return {
            success: true,
            tweetId: tweet.data.id,
            url: `https://twitter.com/user/status/${tweet.data.id}`,
            platform: 'twitter'
        };
    } catch (error) {
        console.error('Twitter post error:', error);
        return {
            success: false,
            error: error.message,
            platform: 'twitter'
        };
    }
};

// Post tweet thread for multiple products
export const postThread = async (products, title = 'Top Offerte del Giorno') => {
    const twitterClient = getClient();

    if (!twitterClient) {
        return { success: false, error: 'Twitter not configured' };
    }

    try {
        const tweets = [];

        // First tweet - intro
        tweets.push(`🔥 ${title} 🔥\n\nEcco le migliori offerte Amazon trovate oggi!\n\n👇 Thread 👇\n\n#AmazonDeals #Sconti`);

        // Product tweets
        for (const product of products.slice(0, 5)) { // Max 5 products in thread
            tweets.push(formatTweet(product));
        }

        // Post thread
        const postedTweets = [];
        let previousTweetId = null;

        for (const tweetText of tweets) {
            const options = {};
            if (previousTweetId) {
                options.reply = { in_reply_to_tweet_id: previousTweetId };
            }

            const tweet = await twitterClient.v2.tweet(tweetText, options);
            postedTweets.push(tweet.data.id);
            previousTweetId = tweet.data.id;

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return {
            success: true,
            tweetIds: postedTweets,
            url: `https://twitter.com/user/status/${postedTweets[0]}`,
            platform: 'twitter'
        };
    } catch (error) {
        console.error('Twitter thread error:', error);
        return {
            success: false,
            error: error.message,
            platform: 'twitter'
        };
    }
};

// Check rate limit status
export const getRateLimitStatus = async () => {
    const twitterClient = getClient();

    if (!twitterClient) {
        return null;
    }

    try {
        const me = await twitterClient.v2.me();
        return { connected: true, username: me.data.username };
    } catch (error) {
        return { connected: false, error: error.message };
    }
};

export default {
    postTweet,
    postThread,
    getRateLimitStatus
};
