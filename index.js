const midtransClient = require('midtrans-client');
const { Client, Databases } = require('node-appwrite');

export default async ({ req, res, log, error }) => {
    try {
        // Parse request body
        const { orderId } = JSON.parse(req.body || '{}');

        if (!orderId) {
            error('❌ Missing orderId in request');
            return res.json({ success: false, error: 'orderId is required' }, 400);
        }

        log(`📝 Creating payment for order: ${orderId}`);

        // Initialize Appwrite client
        const client = new Client()
            .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
            .setProject(process.env.APPWRITE_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);

        const databases = new Databases(client);

        // Get order from database
        log(`🔍 Fetching order from database...`);
        const order = await databases.getDocument(
            process.env.DATABASE_ID,
            process.env.ORDERS_COLLECTION_ID,
            orderId
        );

        log(`✅ Order found: ${order.invoice_number}, Amount: Rp ${order.total_price}`);

        // Initialize Midtrans Snap client
        const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
        log(`🔧 Midtrans mode: ${isProduction ? 'PRODUCTION' : 'SANDBOX'}`);

        const snap = new midtransClient.Snap({
            isProduction: isProduction,
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.MIDTRANS_CLIENT_KEY,
        });

        // Prepare transaction parameters
        const parameter = {
            transaction_details: {
                order_id: order.invoice_number,
                gross_amount: parseInt(order.total_price),
            },
            customer_details: {
                first_name: order.customer_name,
                phone: order.table_number,
            },
            enabled_payments: [
                'gopay', 'shopeepay', 'other_qris',
                'bca_va', 'bni_va', 'bri_va', 'permata_va',
                'credit_card'
            ],
            callbacks: {
                finish: `myapp://payment/finish?order_id=${orderId}`,
            },
        };

        log(`💳 Creating Snap transaction...`);
        const transaction = await snap.createTransaction(parameter);

        log(`✅ Snap token created successfully`);
        log(`   Token: ${transaction.token}`);
        log(`   Redirect URL: ${transaction.redirect_url}`);

        return res.json({
            success: true,
            snapToken: transaction.token,
            redirectUrl: transaction.redirect_url,
            orderId: orderId,
            orderNumber: order.invoice_number,
        });

    } catch (err) {
        error(`❌ Error creating payment: ${err.message}`);
        if (err.stack) {
            error(err.stack);
        }

        return res.json({
            success: false,
            error: err.message || 'Failed to create payment'
        }, 500);
    }
};
