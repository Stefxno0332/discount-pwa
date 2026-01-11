import TelegramBot from 'node-telegram-bot-api';
import config from '../../config/env.js';

let bot = null;

// Initialize Telegram bot
const getBot = () => {
    if (!bot && config.telegram.botToken) {
        bot = new TelegramBot(config.telegram.botToken, { polling: false });
    }
    return bot;
};

// Format product message for Telegram
const formatProductMessage = (product, type = 'deal') => {
    const emoji = type === 'price_drop' ? '📉' : '🔥';
    const title = type === 'price_drop' ? 'PREZZO DIMINUITO' : 'OFFERTA AMAZON';

    let message = `${emoji} <b>${title}</b> ${emoji}\n\n`;
    message += `<b>${escapeHtml(product.title)}</b>\n\n`;
    message += `💰 Prezzo: <s>€${product.originalPrice.toFixed(2)}</s> → <b>€${product.discountedPrice.toFixed(2)}</b>\n`;
    message += `📉 Sconto: <b>${product.discountPercentage}%</b>\n`;

    if (product.rating) {
        message += `⭐ Rating: ${product.rating}/5`;
        if (product.reviewCount) {
            message += ` (${product.reviewCount} recensioni)`;
        }
        message += '\n';
    }

    if (product.brand) {
        message += `🏷️ Brand: ${escapeHtml(product.brand)}\n`;
    }

    message += `\n🔗 <a href="${product.affiliateLink}">Vai all'offerta su Amazon</a>\n`;
    message += `\n#AmazonDeals #Sconti #Offerte`;

    if (product.category) {
        message += ` #${product.category.replace(/\s+/g, '')}`;
    }

    return message;
};

// Escape HTML special characters
const escapeHtml = (text) => {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

// Post product to Telegram channel
export const postToChannel = async (product, type = 'deal') => {
    const telegramBot = getBot();

    if (!telegramBot) {
        console.warn('Telegram bot not configured');
        return { success: false, error: 'Telegram not configured' };
    }

    const channelId = config.telegram.channelId;
    if (!channelId) {
        return { success: false, error: 'Telegram channel ID not configured' };
    }

    try {
        const message = formatProductMessage(product, type);

        // Send photo with caption
        if (product.imageUrl) {
            const result = await telegramBot.sendPhoto(channelId, product.imageUrl, {
                caption: message,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: '🛒 Compra su Amazon',
                            url: product.affiliateLink
                        }
                    ]]
                }
            });

            return {
                success: true,
                messageId: result.message_id,
                platform: 'telegram'
            };
        } else {
            // Send text message if no image
            const result = await telegramBot.sendMessage(channelId, message, {
                parse_mode: 'HTML',
                disable_web_page_preview: false,
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: '🛒 Compra su Amazon',
                            url: product.affiliateLink
                        }
                    ]]
                }
            });

            return {
                success: true,
                messageId: result.message_id,
                platform: 'telegram'
            };
        }
    } catch (error) {
        console.error('Telegram post error:', error);
        return {
            success: false,
            error: error.message,
            platform: 'telegram'
        };
    }
};

// Post multiple products as album
export const postProductAlbum = async (products, title = 'Top Offerte del Giorno') => {
    const telegramBot = getBot();

    if (!telegramBot || !config.telegram.channelId) {
        return { success: false, error: 'Telegram not configured' };
    }

    try {
        // First send the title
        await telegramBot.sendMessage(config.telegram.channelId,
            `🔥 <b>${escapeHtml(title)}</b> 🔥\n\nEcco le migliori offerte trovate:`,
            { parse_mode: 'HTML' }
        );

        // Send products as media group (up to 10)
        const mediaGroup = products.slice(0, 10).map((product, index) => ({
            type: 'photo',
            media: product.imageUrl,
            caption: index === 0
                ? `1️⃣ ${product.title.substring(0, 100)}...\n💰 €${product.discountedPrice.toFixed(2)} (-${product.discountPercentage}%)`
                : `${index + 1}️⃣ ${product.title.substring(0, 100)}...\n💰 €${product.discountedPrice.toFixed(2)} (-${product.discountPercentage}%)`,
            parse_mode: 'HTML'
        }));

        await telegramBot.sendMediaGroup(config.telegram.channelId, mediaGroup);

        return { success: true, platform: 'telegram', count: products.length };
    } catch (error) {
        console.error('Telegram album post error:', error);
        return { success: false, error: error.message };
    }
};

export default {
    postToChannel,
    postProductAlbum
};
