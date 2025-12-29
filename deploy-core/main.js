const midtransClient = require('midtrans-client');
const { Client, Databases, Query } = require('node-appwrite');

// Initialize Core API client
const coreApi = new midtransClient.CoreApi({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

async function chargeGoPay(order, log) {
    const parameter = {
        payment_type: 'gopay',
        transaction_details: {
            order_id: order.invoice_number,
            gross_amount: order.total_price
        },
        gopay: {
            enable_callback: true,
            callback_url: `${process.env.WEB_CALLBACK_URL || 'https://kantin-web-ordering.vercel.app'}/payment-callback.html?order_id=${order.$id}`
        }
    };

    log('📱 Charging GoPay...');
    const charge = await coreApi.charge(parameter);

    return {
        type: 'redirect',
        redirectUrl: charge.actions.find(a => a.name === 'deeplink-redirect')?.url || charge.actions.find(a => a.name === 'generate-qr-code')?.url
    };
}

async function chargeQRIS(order, log) {
    const parameter = {
        payment_type: 'qris',
        transaction_details: {
            order_id: order.invoice_number,
            gross_amount: order.total_price
        }
    };

    log('🔲 Charging QRIS...');
    const charge = await coreApi.charge(parameter);

    return {
        type: 'qr',
        qrString: charge.qr_string
    };
}

async function chargeVirtualAccount(order, bank, log) {
    const parameter = {
        payment_type: 'bank_transfer',
        transaction_details: {
            order_id: order.invoice_number,
            gross_amount: order.total_price
        },
        bank_transfer: {
            bank: bank
        }
    };

    log(`🏦 Charging ${bank.toUpperCase()} VA...`);
    const charge = await coreApi.charge(parameter);

    return {
        type: 'va',
        vaNumber: charge.va_numbers[0].va_number,
        bank: bank.toUpperCase()
    };
}

async function chargeShopeePay(order, log) {
    const parameter = {
        payment_type: 'shopeepay',
        transaction_details: {
            order_id: order.invoice_number,
            gross_amount: order.total_price
        },
        shopeepay: {
            callback_url: `${process.env.WEB_CALLBACK_URL || 'https://kantin-web-ordering.vercel.app'}/payment-callback.html?order_id=${order.$id}`
        }
    };

    log('🛒 Charging ShopeePay...');
    const charge = await coreApi.charge(parameter);

    return {
        type: 'redirect',
        redirectUrl: charge.actions.find(a => a.name === 'deeplink-redirect')?.url
    };
}

module.exports = async ({ req, res, log, error }) => {
    try {
        // Parse request body
        let body;
        if (typeof req.body === 'string') {
            body = JSON.parse(req.body || '{}');
        } else {
            body = req.body || {};
        }

        // Extract body if double-wrapped (from Appwrite execution API)
        if (body.body && typeof body.body === 'string') {
            body = JSON.parse(body.body);
        }

        const { orderId, paymentMethod } = body;

        log('💳 Payment request received');
        log(`📦 Order ID: ${orderId}`);
        log(`💰 Payment Method: ${paymentMethod}`);

        if (!orderId || !paymentMethod) {
            error('❌ Missing required parameters');
            return res.json({
                success: false,
                error: 'orderId and paymentMethod are required'
            }, 400);
        }

        // Initialize Appwrite
        const client = new Client()
            .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
            .setProject(process.env.APPWRITE_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);

        const databases = new Databases(client);

        // Get order details
        const order = await databases.getDocument(
            process.env.DATABASE_ID,
            process.env.ORDERS_COLLECTION_ID,
            orderId
        );

        log(`✅ Order found: ${order.invoice_number}`);
        log(`💵 Total amount: ${order.total_price}`);
        log(`📋 Admin fee: ${order.admin_fee || 0}`);

        // Route to specific payment method
        let chargeResult;

        switch (paymentMethod) {
            case 'gopay':
                chargeResult = await chargeGoPay(order, log);
                break;
            case 'qris':
                chargeResult = await chargeQRIS(order, log);
                break;
            case 'shopeepay':
                chargeResult = await chargeShopeePay(order, log);
                break;
            case 'bca':
            case 'bni':
            case 'bri':
            case 'permata':
                chargeResult = await chargeVirtualAccount(order, paymentMethod, log);
                break;
            default:
                error(`❌ Unsupported payment method: ${paymentMethod}`);
                return res.json({
                    success: false,
                    error: `Payment method '${paymentMethod}' not supported`
                }, 400);
        }

        log('✅ Payment charge successful');

        return res.json({
            success: true,
            orderId: order.$id,
            orderNumber: order.invoice_number,
            paymentData: chargeResult
        });

    } catch (err) {
        error(`❌ Error: ${err.message}`);
        error(err.stack);

        return res.json({
            success: false,
            error: err.message
        }, 500);
    }
};
