import { Product } from '../models/index.js';
import { Parser } from '@json2csv/node';
import PDFDocument from 'pdfkit';

// Export products to CSV
export const exportToCSV = async (query = {}) => {
    const products = await Product.find(query).lean();

    const fields = [
        { label: 'ASIN', value: 'asin' },
        { label: 'Titolo', value: 'title' },
        { label: 'Categoria', value: 'category' },
        { label: 'Prezzo Originale', value: 'originalPrice' },
        { label: 'Prezzo Scontato', value: 'discountedPrice' },
        { label: 'Sconto %', value: 'discountPercentage' },
        { label: 'Rating', value: 'rating' },
        { label: 'Recensioni', value: 'reviewCount' },
        { label: 'Brand', value: 'brand' },
        { label: 'Link', value: 'affiliateLink' }
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(products);

    return csv;
};

// Export products to PDF
export const exportToPDF = async (query = {}, title = 'Lista Sconti Amazon') => {
    const products = await Product.find(query).sort({ dealScore: -1 }).limit(50).lean();

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title
        doc.fontSize(24).font('Helvetica-Bold').text(title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).font('Helvetica').text(
            `Generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`,
            { align: 'center' }
        );
        doc.moveDown(2);

        // Products
        products.forEach((product, index) => {
            // Check if we need a new page
            if (doc.y > 700) {
                doc.addPage();
            }

            doc.fontSize(14).font('Helvetica-Bold')
                .text(`${index + 1}. ${product.title.substring(0, 80)}${product.title.length > 80 ? '...' : ''}`);

            doc.fontSize(11).font('Helvetica')
                .text(`Categoria: ${product.category}`)
                .text(`Prezzo: €${product.originalPrice.toFixed(2)} → €${product.discountedPrice.toFixed(2)} (-${product.discountPercentage}%)`)
                .text(`Rating: ${product.rating}/5 (${product.reviewCount} recensioni)`)
                .text(`Link: ${product.affiliateLink}`, { link: product.affiliateLink });

            doc.moveDown();
        });

        // Footer
        doc.fontSize(10).font('Helvetica').text(
            'Generato da Amazon Discount PWA',
            50,
            doc.page.height - 50,
            { align: 'center' }
        );

        doc.end();
    });
};

export default {
    exportToCSV,
    exportToPDF
};
