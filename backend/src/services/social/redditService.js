import Snoowrap from 'snoowrap';
import config from '../../config/env.js';

let reddit = null;

// Initialize Reddit client
const getClient = () => {
    if (!reddit && config.reddit.clientId && config.reddit.clientSecret) {
        reddit = new Snoowrap({
            userAgent: config.reddit.userAgent,
            clientId: config.reddit.clientId,
            clientSecret: config.reddit.clientSecret,
            username: config.reddit.username,
            password: config.reddit.password
        });

        // Configure rate limiting
        reddit.config({
            requestDelay: 1000,
            continueAfterRatelimitError: true
        });
    }
    return reddit;
};

// Format post title for Reddit
const formatTitle = (product, type = 'deal') => {
    const prefix = type === 'price_drop' ? '[Prezzo Diminuito]' : '[Offerta]';
    const discount = `-${product.discountPercentage}%`;
    const price = `€${product.discountedPrice.toFixed(2)}`;

    // Reddit titles have a 300 character limit
    const maxTitleLength = 280;
    let title = `${prefix} ${product.title} | ${discount} | ${price}`;

    if (title.length > maxTitleLength) {
        const truncatedProductTitle = product.title.substring(0, maxTitleLength - 50);
        title = `${prefix} ${truncatedProductTitle}... | ${discount} | ${price}`;
    }

    return title;
};

// Format post body for Reddit
const formatBody = (product, type = 'deal') => {
    let body = `# ${product.title}\n\n`;

    body += `## 💰 Prezzo\n`;
    body += `- **Prezzo originale:** ~~€${product.originalPrice.toFixed(2)}~~\n`;
    body += `- **Prezzo attuale:** **€${product.discountedPrice.toFixed(2)}**\n`;
    body += `- **Sconto:** **${product.discountPercentage}%**\n\n`;

    if (product.rating) {
        body += `## ⭐ Valutazione\n`;
        body += `${product.rating}/5 stelle`;
        if (product.reviewCount) {
            body += ` (${product.reviewCount} recensioni)`;
        }
        body += `\n\n`;
    }

    if (product.brand) {
        body += `**Brand:** ${product.brand}\n\n`;
    }

    if (product.features && product.features.length > 0) {
        body += `## 📋 Caratteristiche\n`;
        product.features.slice(0, 5).forEach(feature => {
            body += `- ${feature}\n`;
        });
        body += `\n`;
    }

    body += `---\n\n`;
    body += `🔗 [**Vai all'offerta su Amazon**](${product.affiliateLink})\n\n`;
    body += `---\n`;
    body += `*Postato automaticamente da Amazon Discount PWA*`;

    return body;
};

// Post to a subreddit
export const postToSubreddit = async (product, subreddit = 'DealsItalia', type = 'deal') => {
    const client = getClient();

    if (!client) {
        console.warn('Reddit not configured');
        return { success: false, error: 'Reddit not configured' };
    }

    try {
        const title = formatTitle(product, type);
        const body = formatBody(product, type);

        // Submit the post
        const submission = await client.getSubreddit(subreddit).submitSelfpost({
            title,
            text: body,
            sendReplies: false
        });

        return {
            success: true,
            postId: submission.name,
            url: `https://reddit.com${submission.permalink}`,
            platform: 'reddit'
        };
    } catch (error) {
        console.error('Reddit post error:', error);
        return {
            success: false,
            error: error.message,
            platform: 'reddit'
        };
    }
};

// Post as a link submission (with thumbnail)
export const postLinkToSubreddit = async (product, subreddit = 'DealsItalia') => {
    const client = getClient();

    if (!client) {
        return { success: false, error: 'Reddit not configured' };
    }

    try {
        const title = formatTitle(product);

        const submission = await client.getSubreddit(subreddit).submitLink({
            title,
            url: product.affiliateLink,
            sendReplies: false
        });

        return {
            success: true,
            postId: submission.name,
            url: `https://reddit.com${submission.permalink}`,
            platform: 'reddit'
        };
    } catch (error) {
        console.error('Reddit link post error:', error);
        return {
            success: false,
            error: error.message,
            platform: 'reddit'
        };
    }
};

// Check if we can post (rate limiting)
export const canPost = async () => {
    const client = getClient();
    if (!client) return false;

    try {
        // Check remaining rate limit
        const me = await client.getMe();
        return me !== null;
    } catch (error) {
        return false;
    }
};

export default {
    postToSubreddit,
    postLinkToSubreddit,
    canPost
};
