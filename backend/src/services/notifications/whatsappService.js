import twilio from 'twilio';
import config from '../../config/env.js';

let client = null;

// Initialize Twilio client
const getClient = () => {
    if (!client && config.twilio.accountSid && config.twilio.authToken) {
        client = twilio(config.twilio.accountSid, config.twilio.authToken);
    }
    return client;
};

// Send WhatsApp message
export const sendWhatsAppMessage = async (to, message, mediaUrl = null) => {
    const twilioClient = getClient();

    if (!twilioClient) {
        console.warn('Twilio not configured, skipping WhatsApp message');
        return { success: false, error: 'Twilio not configured' };
    }

    try {
        // Format phone number for WhatsApp
        const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

        const messageOptions = {
            from: config.twilio.whatsappNumber,
            to: formattedTo,
            body: message
        };

        // Add media if provided
        if (mediaUrl) {
            messageOptions.mediaUrl = [mediaUrl];
        }

        const result = await twilioClient.messages.create(messageOptions);

        return {
            success: true,
            messageId: result.sid,
            status: result.status
        };
    } catch (error) {
        console.error('WhatsApp send error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Send deal notification via WhatsApp
export const sendDealNotification = async (phoneNumber, product) => {
    const message = formatDealMessage(product);
    return await sendWhatsAppMessage(phoneNumber, message, product.imageUrl);
};

// Send price drop notification via WhatsApp
export const sendPriceDropNotification = async (phoneNumber, product, oldPrice) => {
    const message = formatPriceDropMessage(product, oldPrice);
    return await sendWhatsAppMessage(phoneNumber, message, product.imageUrl);
};

// Format deal message for WhatsApp
const formatDealMessage = (product) => {
    return `🔥 *OFFERTA AMAZON* 🔥

*${product.title}*

💰 Prezzo: ~€${product.originalPrice.toFixed(2)}~ → *€${product.discountedPrice.toFixed(2)}*
📉 Sconto: *${product.discountPercentage}%*
⭐ Rating: ${product.rating}/5 (${product.reviewCount} recensioni)

🔗 ${product.affiliateLink}

_Amazon Discount PWA - Non perdere le migliori offerte!_`;
};

// Format price drop message for WhatsApp
const formatPriceDropMessage = (product, oldPrice) => {
    const priceDrop = (oldPrice - product.discountedPrice).toFixed(2);

    return `📉 *PREZZO DIMINUITO* 📉

*${product.title}*

💰 Prima: €${oldPrice.toFixed(2)}
💰 *Ora: €${product.discountedPrice.toFixed(2)}*
💸 Risparmio: *€${priceDrop}*

🔗 ${product.affiliateLink}

_Il prodotto nella tua watchlist è appena sceso di prezzo!_`;
};

// Send bulk notifications
export const sendBulkNotifications = async (phoneNumbers, product) => {
    const results = {
        sent: 0,
        failed: 0,
        errors: []
    };

    for (const phone of phoneNumbers) {
        const result = await sendDealNotification(phone, product);

        if (result.success) {
            results.sent++;
        } else {
            results.failed++;
            results.errors.push({ phone, error: result.error });
        }

        // Rate limiting - wait 100ms between messages
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
};

// Verify phone number format
export const isValidPhoneNumber = (phone) => {
    // Basic validation for international phone numbers
    const phoneRegex = /^\+[1-9]\d{6,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
};

export default {
    sendWhatsAppMessage,
    sendDealNotification,
    sendPriceDropNotification,
    sendBulkNotifications,
    isValidPhoneNumber
};
