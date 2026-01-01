const crypto = require('crypto');
const { Client, Databases, Query } = require('node-appwrite');

// Fee configuration based on Midtrans pricing
const PAYMENT_FEES = {
    // Virtual Account - Flat IDR 4.000
    'bank_transfer': 4000,
    'bca_va': 4000,
    'bni_va': 4000,
    'bri_va': 4000,
    'permata_va': 4000,
    'echannel': 2500, // Mandiri Bill

    // E-Wallet - Percentage based
    'gopay': { type: 'percentage', rate: 0.02 }, // 2%
    'shopeepay': { type: 'percentage', rate: 0.02 }, // 2%
    'qris': { type: 'percentage', rate: 0.007 }, // 0.7%
    'dana': { type: 'percentage', rate: 0.015 }, // 1.5%

    // Credit Card
    'credit_card': { type: 'mixed', rate: 0.029, fixed: 2000 }, // 2.9% + Rp 2.000

    // Retail
    'cstore': 5000, // Alfamart/Indomaret

    // Pay Later
    'akulaku': { type: 'percentage', rate: 0.017 }, // 1.7%
    'kredivo': { type: 'percentage', rate: 0.02 }, // 2%
};

function calculateFee(paymentType, amount) {
    const feeConfig = PAYMENT_FEES[paymentType];

    if (!feeConfig) {
        // Default fee for unknown payment types
        return 3000;
    }

    if (typeof feeConfig === 'number') {
        return feeConfig; // Flat fee
    }

    if (feeConfig.type === 'percentage') {
        return Math.ceil(amount * feeConfig.rate);
    }

    if (feeConfig.type === 'mixed') {
        return Math.ceil(amount * feeConfig.rate) + feeConfig.fixed;
    }

    return 3000; // Fallback
}

module.exports = async ({ req, res, log, error }) => {
    try {
        // Parse notification from Midtrans
        const notification = typeof req.body === 'string'
            ? JSON.parse(req.body)
            : req.body;

        log('📥 Webhook notification received');
        log(`Order ID: ${notification.order_id}`);
        log(`Payment Type: ${notification.payment_type}`);
        log(`Transaction Status: ${notification.transaction_status}`);

        // Verify Midtrans signature (IMPORTANT for security!)
        const serverKey = process.env.MIDTRANS_SERVER_KEY;
        const orderId = notification.order_id;
        const statusCode = notification.status_code;
        const grossAmount = notification.gross_amount;
        const signatureKey = notification.signature_key;

        const expectedSignature = crypto
            .createHash('sha512')
            .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
            .digest('hex');

        if (expectedSignature !== signatureKey) {
            error('❌ Invalid signature - possible fraud attempt!');
            return res.json({
                status: 'error',
                message: 'Invalid signature'
            }, 403);
        }

        log('✅ Signature verified');

        // Initialize Appwrite
        const client = new Client()
            .setEndpoint(process.env.APPWRITE_ENDPOINT)
            .setProject(process.env.APPWRITE_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);

        const databases = new Databases(client);

        // Find order by invoice number
        const orders = await databases.listDocuments(
            process.env.DATABASE_ID,
            process.env.ORDERS_COLLECTION_ID,
            [Query.equal('invoice_number', orderId)]
        );

        if (orders.documents.length === 0) {
            error(`❌ Order not found: ${orderId}`);
            return res.json({
                status: 'error',
                message: 'Order not found'
            }, 404);
        }

        const order = orders.documents[0];
        const paymentType = notification.payment_type;
        const transactionStatus = notification.transaction_status;

        // Calculate admin fee based on payment method
        const subtotal = order.total_price; // Original price (without fee)
        const adminFee = calculateFee(paymentType, subtotal);
        const newTotal = subtotal + adminFee;

        log(`💰 Subtotal: ${subtotal}`);
        log(`💳 Payment method: ${paymentType}`);
        log(`📊 Admin fee: ${adminFee}`);
        log(`💵 New total: ${newTotal}`);

        // Map Midtrans status to order status
        let orderStatus = order.order_status;

        if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
            orderStatus = 'confirmed';
        } else if (transactionStatus === 'pending') {
            orderStatus = 'pending_payment';
        } else if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
            orderStatus = 'cancelled';
        }

        // Update order with fee and status
        await databases.updateDocument(
            process.env.DATABASE_ID,
            process.env.ORDERS_COLLECTION_ID,
            order.$id,
            {
                admin_fee: adminFee,
                total_price: newTotal,
                payment_type: paymentType,
                order_status: orderStatus
            }
        );

        log('✅ Order updated successfully');
        log(`   Admin fee: ${adminFee}`);
        log(`   Total: ${newTotal}`);
        log(`   Status: ${orderStatus}`);

        return res.json({
            status: 'success',
            message: 'Notification processed',
            fee: adminFee,
            order_id: order.$id
        });

    } catch (err) {
        error(`❌ Webhook error: ${err.message}`);
        error(err.stack);

        return res.json({
            status: 'error',
            message: err.message
        }, 500);
    }
};
