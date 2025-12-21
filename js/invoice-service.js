// Invoice Service (JavaScript version)
// Ported from Flutter InvoiceService

const InvoiceService = {
    // Generate invoice number
    generateInvoiceNumber() {
        const now = new Date();
        const dateStr = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0');
        const random = this._generateRandomCode(7);

        return `INV-${dateStr}-${random}`;
    },

    // Generate random code
    _generateRandomCode(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    // Check if invoice exists in database
    async checkInvoiceExists(databases, invoice) {
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.orders,
                [
                    Appwrite.Query.equal('invoice_number', invoice),
                    Appwrite.Query.limit(1)
                ]
            );

            return response.documents.length > 0;
        } catch (error) {
            console.error('Error checking invoice:', error);
            return false;
        }
    }
};

// Generate unique invoice with retry mechanism
async function generateUniqueInvoice(databases, maxRetries = 5) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const invoice = InvoiceService.generateInvoiceNumber();

        try {
            const exists = await InvoiceService.checkInvoiceExists(databases, invoice);

            if (!exists) {
                console.log(`✅ Invoice generated: ${invoice} (attempt ${attempt})`);
                return invoice;
            }

            console.log(`⚠️ Invoice collision detected: ${invoice} (attempt ${attempt}/${maxRetries})`);

        } catch (error) {
            console.error('Error generating invoice:', error);

            if (attempt === maxRetries) {
                throw {
                    message: 'Failed to generate invoice',
                    userMessage: 'Gagal membuat nomor invoice. Silakan coba lagi.'
                };
            }
        }
    }

    throw {
        message: 'Failed to generate unique invoice after ' + maxRetries + ' attempts',
        userMessage: 'Gagal membuat nomor invoice. Silakan coba lagi.'
    };
}
