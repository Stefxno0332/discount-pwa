import ProductAdvertisingAPIv1 from 'paapi5-nodejs-sdk';
import config from '../../config/env.js';
import { cacheGet, cacheSet } from '../../config/redis.js';
import { Product } from '../../models/index.js';

// Initialize PA-API client
const defaultClient = ProductAdvertisingAPIv1.ApiClient.instance;
defaultClient.accessKey = config.amazon.accessKey;
defaultClient.secretKey = config.amazon.secretKey;

// Set host based on marketplace
const hosts = {
    'www.amazon.it': 'webservices.amazon.it',
    'www.amazon.com': 'webservices.amazon.com',
    'www.amazon.co.uk': 'webservices.amazon.co.uk',
    'www.amazon.de': 'webservices.amazon.de',
    'www.amazon.fr': 'webservices.amazon.fr',
    'www.amazon.es': 'webservices.amazon.es'
};

defaultClient.host = hosts[config.amazon.marketplace] || 'webservices.amazon.it';
defaultClient.region = config.amazon.region || 'eu-west-1';

const api = new ProductAdvertisingAPIv1.DefaultApi();

// Available categories for Amazon Italy
export const AMAZON_CATEGORIES = {
    'Electronics': 'Electronics',
    'Computers': 'Computers',
    'HomeAndGarden': 'HomeGarden',
    'Kitchen': 'Kitchen',
    'Fashion': 'Fashion',
    'Beauty': 'Beauty',
    'Sports': 'SportingGoods',
    'Toys': 'Toys',
    'Books': 'Books',
    'VideoGames': 'VideoGames',
    'Music': 'Music',
    'Automotive': 'Automotive',
    'Baby': 'Baby',
    'Pet': 'PetSupplies',
    'Office': 'OfficeProducts'
};

// Resources to request from Amazon API
const ITEM_RESOURCES = [
    'Images.Primary.Large',
    'ItemInfo.Title',
    'ItemInfo.Features',
    'ItemInfo.ByLineInfo',
    'Offers.Listings.Price',
    'Offers.Listings.SavingBasis',
    'BrowseNodeInfo.BrowseNodes',
    'CustomerReviews.Count',
    'CustomerReviews.StarRating'
];

// Search for products with deals
export const searchDeals = async (options = {}) => {
    const {
        searchIndex = 'All',
        keywords = '',
        minDiscount = 10,
        maxPrice = null,
        minPrice = null,
        sortBy = 'Featured',
        page = 1
    } = options;

    const cacheKey = `amazon:search:${JSON.stringify(options)}`;

    // Check cache first
    const cached = await cacheGet(cacheKey);
    if (cached) {
        return cached;
    }

    // Check if API is configured
    if (!config.amazon.accessKey || !config.amazon.secretKey) {
        console.warn('Amazon PA-API not configured, returning empty results');
        return { products: [], totalResults: 0 };
    }

    try {
        const searchItemsRequest = new ProductAdvertisingAPIv1.SearchItemsRequest();
        searchItemsRequest.PartnerTag = config.amazon.partnerTag;
        searchItemsRequest.PartnerType = 'Associates';
        searchItemsRequest.Keywords = keywords || 'offerte';
        searchItemsRequest.SearchIndex = searchIndex;
        searchItemsRequest.ItemCount = 10;
        searchItemsRequest.ItemPage = page;
        searchItemsRequest.Resources = ITEM_RESOURCES;

        // Price filters
        if (minPrice) {
            searchItemsRequest.MinPrice = Math.round(minPrice * 100);
        }
        if (maxPrice) {
            searchItemsRequest.MaxPrice = Math.round(maxPrice * 100);
        }

        const response = await new Promise((resolve, reject) => {
            api.searchItems(searchItemsRequest, (error, data) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(data);
                }
            });
        });

        if (!response.SearchResult || !response.SearchResult.Items) {
            return { products: [], totalResults: 0 };
        }

        // Filter and transform products
        const products = response.SearchResult.Items
            .map(item => transformProduct(item))
            .filter(product => product && product.discountPercentage >= minDiscount);

        const result = {
            products,
            totalResults: response.SearchResult.TotalResultCount || products.length
        };

        // Cache for 30 minutes
        await cacheSet(cacheKey, result, 1800);

        return result;
    } catch (error) {
        console.error('Amazon PA-API search error:', error.message || error);
        // Return empty results instead of throwing
        return { products: [], totalResults: 0 };
    }
};

// Get product details by ASIN
export const getProductByAsin = async (asin) => {
    const cacheKey = `amazon:product:${asin}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
        return cached;
    }

    // Check if API is configured
    if (!config.amazon.accessKey || !config.amazon.secretKey) {
        return null;
    }

    try {
        const getItemsRequest = new ProductAdvertisingAPIv1.GetItemsRequest();
        getItemsRequest.PartnerTag = config.amazon.partnerTag;
        getItemsRequest.PartnerType = 'Associates';
        getItemsRequest.ItemIds = [asin];
        getItemsRequest.Resources = ITEM_RESOURCES;

        const response = await new Promise((resolve, reject) => {
            api.getItems(getItemsRequest, (error, data) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(data);
                }
            });
        });

        if (!response.ItemsResult || !response.ItemsResult.Items || response.ItemsResult.Items.length === 0) {
            return null;
        }

        const product = transformProduct(response.ItemsResult.Items[0]);

        if (product) {
            // Cache for 1 hour
            await cacheSet(cacheKey, product, 3600);
        }

        return product;
    } catch (error) {
        console.error('Amazon PA-API get item error:', error.message || error);
        return null;
    }
};

// Browse products by category (node)
export const browseByCategory = async (categoryId, options = {}) => {
    const { page = 1 } = options;

    const cacheKey = `amazon:browse:${categoryId}:${page}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
        return cached;
    }

    // Use search with category
    return await searchDeals({
        searchIndex: categoryId,
        keywords: 'offerte',
        page
    });
};

// Transform Amazon API response to our product format
const transformProduct = (item) => {
    try {
        const listing = item.Offers?.Listings?.[0];

        if (!listing) {
            return null;
        }

        const currentPrice = listing.Price?.Amount || 0;
        const originalPrice = listing.SavingBasis?.Amount || listing.Price?.Amount || currentPrice;

        // Calculate discount percentage
        const discountPercentage = originalPrice > currentPrice
            ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
            : 0;

        // Get category from browse nodes
        const browseNodes = item.BrowseNodeInfo?.BrowseNodes || [];
        const category = browseNodes[0]?.DisplayName || 'Generale';
        const categoryPath = browseNodes.map(node => node.DisplayName).slice(0, 3);

        // Get rating
        const rating = item.CustomerReviews?.StarRating?.Value || 0;
        const reviewCount = item.CustomerReviews?.Count || 0;

        return {
            asin: item.ASIN,
            title: item.ItemInfo?.Title?.DisplayValue || 'Prodotto senza titolo',
            description: (item.ItemInfo?.Features?.DisplayValues || []).join(' '),
            imageUrl: item.Images?.Primary?.Large?.URL || '',
            originalPrice,
            discountedPrice: currentPrice,
            discountPercentage,
            category,
            categoryPath,
            rating,
            reviewCount,
            affiliateLink: item.DetailPageURL,
            brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || '',
            features: item.ItemInfo?.Features?.DisplayValues || [],
            freeShipping: listing.DeliveryInfo?.IsFreeShippingEligible || false
        };
    } catch (error) {
        console.error('Error transforming product:', error);
        return null;
    }
};

// Sync products from Amazon to database
export const syncProductsToDatabase = async (products) => {
    const results = {
        created: 0,
        updated: 0,
        errors: 0
    };

    for (const productData of products) {
        try {
            const existingProduct = await Product.findOne({ asin: productData.asin });

            if (existingProduct) {
                // Update existing product
                existingProduct.title = productData.title;
                existingProduct.description = productData.description;
                existingProduct.imageUrl = productData.imageUrl;
                existingProduct.originalPrice = productData.originalPrice;
                existingProduct.discountedPrice = productData.discountedPrice;
                existingProduct.discountPercentage = productData.discountPercentage;
                existingProduct.category = productData.category;
                existingProduct.categoryPath = productData.categoryPath;
                existingProduct.rating = productData.rating;
                existingProduct.reviewCount = productData.reviewCount;
                existingProduct.affiliateLink = productData.affiliateLink;
                existingProduct.brand = productData.brand;
                existingProduct.features = productData.features;
                existingProduct.lastUpdated = new Date();

                // Add to price history
                existingProduct.priceHistory.push({
                    price: productData.discountedPrice,
                    date: new Date()
                });

                // Keep only last 90 days of price history
                const ninetyDaysAgo = new Date();
                ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
                existingProduct.priceHistory = existingProduct.priceHistory.filter(
                    p => p.date > ninetyDaysAgo
                );

                await existingProduct.save();
                results.updated++;
            } else {
                // Create new product
                const newProduct = new Product({
                    ...productData,
                    priceHistory: [{
                        price: productData.discountedPrice,
                        date: new Date()
                    }]
                });

                await newProduct.save();
                results.created++;
            }
        } catch (error) {
            console.error(`Error syncing product ${productData.asin}:`, error);
            results.errors++;
        }
    }

    return results;
};

export default {
    searchDeals,
    getProductByAsin,
    browseByCategory,
    syncProductsToDatabase,
    AMAZON_CATEGORIES
};
