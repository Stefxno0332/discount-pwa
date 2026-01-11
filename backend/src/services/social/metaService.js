import axios from 'axios';
import config from '../../config/env.js';

const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0';

// Format post message for Meta platforms
const formatPostMessage = (product, type = 'deal') => {
    const emoji = type === 'price_drop' ? '📉' : '🔥';

    let message = `${emoji} ${type === 'price_drop' ? 'PREZZO DIMINUITO' : 'OFFERTA AMAZON'} ${emoji}\n\n`;
    message += `${product.title}\n\n`;
    message += `💰 Prezzo: €${product.originalPrice.toFixed(2)} → €${product.discountedPrice.toFixed(2)}\n`;
    message += `📉 Sconto: ${product.discountPercentage}%\n`;

    if (product.rating) {
        message += `⭐ Rating: ${product.rating}/5\n`;
    }

    message += `\n🔗 Link in bio o clicca qui: ${product.affiliateLink}\n\n`;
    message += `#AmazonDeals #Sconti #Offerte #Shopping #RisparmiareOnline`;

    if (product.category) {
        message += ` #${product.category.replace(/\s+/g, '')}`;
    }

    return message;
};

// Post to Facebook Page
export const postToFacebook = async (product, type = 'deal') => {
    if (!config.meta.accessToken || !config.meta.pageId) {
        console.warn('Facebook not configured');
        return { success: false, error: 'Facebook not configured' };
    }

    try {
        const message = formatPostMessage(product, type);

        // Post with photo
        if (product.imageUrl) {
            const response = await axios.post(
                `${GRAPH_API_BASE}/${config.meta.pageId}/photos`,
                {
                    url: product.imageUrl,
                    caption: message,
                    access_token: config.meta.accessToken
                }
            );

            return {
                success: true,
                postId: response.data.id,
                platform: 'facebook'
            };
        } else {
            // Post without photo
            const response = await axios.post(
                `${GRAPH_API_BASE}/${config.meta.pageId}/feed`,
                {
                    message,
                    link: product.affiliateLink,
                    access_token: config.meta.accessToken
                }
            );

            return {
                success: true,
                postId: response.data.id,
                platform: 'facebook'
            };
        }
    } catch (error) {
        console.error('Facebook post error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error?.message || error.message,
            platform: 'facebook'
        };
    }
};

// Post to Instagram (requires Business/Creator account)
export const postToInstagram = async (product, type = 'deal') => {
    if (!config.meta.accessToken || !config.meta.instagramAccountId) {
        console.warn('Instagram not configured');
        return { success: false, error: 'Instagram not configured' };
    }

    if (!product.imageUrl) {
        return { success: false, error: 'Instagram requires an image' };
    }

    try {
        const message = formatPostMessage(product, type);

        // Step 1: Create media container
        const createMediaResponse = await axios.post(
            `${GRAPH_API_BASE}/${config.meta.instagramAccountId}/media`,
            {
                image_url: product.imageUrl,
                caption: message,
                access_token: config.meta.accessToken
            }
        );

        const containerId = createMediaResponse.data.id;

        // Step 2: Wait for media to be processed (poll status)
        let status = 'IN_PROGRESS';
        let attempts = 0;

        while (status === 'IN_PROGRESS' && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const statusResponse = await axios.get(
                `${GRAPH_API_BASE}/${containerId}`,
                {
                    params: {
                        fields: 'status_code',
                        access_token: config.meta.accessToken
                    }
                }
            );

            status = statusResponse.data.status_code;
            attempts++;
        }

        if (status !== 'FINISHED') {
            return {
                success: false,
                error: `Media processing failed with status: ${status}`,
                platform: 'instagram'
            };
        }

        // Step 3: Publish the container
        const publishResponse = await axios.post(
            `${GRAPH_API_BASE}/${config.meta.instagramAccountId}/media_publish`,
            {
                creation_id: containerId,
                access_token: config.meta.accessToken
            }
        );

        return {
            success: true,
            postId: publishResponse.data.id,
            platform: 'instagram'
        };
    } catch (error) {
        console.error('Instagram post error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error?.message || error.message,
            platform: 'instagram'
        };
    }
};

// Post carousel to Instagram (multiple images)
export const postCarouselToInstagram = async (products) => {
    if (!config.meta.accessToken || !config.meta.instagramAccountId) {
        return { success: false, error: 'Instagram not configured' };
    }

    try {
        // Create containers for each image
        const childContainers = [];

        for (const product of products.slice(0, 10)) { // Max 10 images
            if (!product.imageUrl) continue;

            const response = await axios.post(
                `${GRAPH_API_BASE}/${config.meta.instagramAccountId}/media`,
                {
                    image_url: product.imageUrl,
                    is_carousel_item: true,
                    access_token: config.meta.accessToken
                }
            );

            childContainers.push(response.data.id);

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (childContainers.length < 2) {
            return { success: false, error: 'Carousel needs at least 2 images' };
        }

        // Create carousel container
        const caption = `🔥 TOP OFFERTE DEL GIORNO 🔥\n\nScopri gli sconti migliori su Amazon!\n\n#AmazonDeals #Sconti #Offerte`;

        const carouselResponse = await axios.post(
            `${GRAPH_API_BASE}/${config.meta.instagramAccountId}/media`,
            {
                media_type: 'CAROUSEL',
                children: childContainers.join(','),
                caption,
                access_token: config.meta.accessToken
            }
        );

        // Publish carousel
        const publishResponse = await axios.post(
            `${GRAPH_API_BASE}/${config.meta.instagramAccountId}/media_publish`,
            {
                creation_id: carouselResponse.data.id,
                access_token: config.meta.accessToken
            }
        );

        return {
            success: true,
            postId: publishResponse.data.id,
            platform: 'instagram'
        };
    } catch (error) {
        console.error('Instagram carousel error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error?.message || error.message,
            platform: 'instagram'
        };
    }
};

export default {
    postToFacebook,
    postToInstagram,
    postCarouselToInstagram
};
