const midtransClient = require('midtrans-client');
const { Client, Databases } = require('node-appwrite');

module.exports = async ({ req, res, log, error }) => {
    try {
        // Parse request body - Appwrite may send pre-parsed object or string
        let body;
        if (typeof req.body === 'string') {
            body = JSON.parse(req.body || '{}');
        } else {
            body = req.body || {};
        }

        const { action, orderId, platform } = body;

        if (!orderId) {
            error('❌ Missing orderId in request');
            return res.json({ success: false, error: 'orderId is required' }, 400);
        }

        // Route based on action
        if (action === 'checkStatus') {
            return await checkPaymentStatus({ orderId, res, log, error });
        } else {
            // Default: create payment (backwards compatible)
            return await createPayment({ orderId, platform, res, log, error });
        }

    } catch (err) {
        error(`❌ Error: ${err.message}`);
        if (err.stack) {
            error(err.stack);
        }

        return res.json({
            success: false,
            error: err.message || 'Operation failed'
        }, 500);
    }
};

// =============================================
// CREATE PAYMENT (Original functionality)
// =============================================
async function createPayment({ orderId, platform, res, log, error }) {
    log(`📝 Creating payment for order: ${orderId}`);
    log(`🌐 Platform: ${platform || 'mobile (default)'}`);  // Log platform info

    // Initialize Appwrite client
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
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
            order_id: order.invoice_number,  // Use invoice_number as Midtrans order_id
            gross_amount: parseInt(order.total_price),
        },
        customer_details: {
            first_name: order.customer_name,
            phone: order.table_number, // Using table_number as phone for now
        },
        // Enable specific payment methods
        enabled_payments: [
            'gopay', 'shopeepay', 'other_qris',
            'bca_va', 'bni_va', 'bri_va', 'permata_va',
            'credit_card'
        ],
        // Dynamic callbacks based on platform
        callbacks: {
            finish: platform === 'web'
                ? `${process.env.WEB_CALLBACK_URL || 'http://localhost:8080'}/payment-callback.html?order_id=${orderId}`
                : `myapp://payment/finish?order_id=${orderId}`,
        },
    };

    log(`💳 Creating Snap transaction...`);
    const transaction = await snap.createTransaction(parameter);

    log(`✅ Snap token created successfully`);
    log(`   Token: ${transaction.token}`);
    log(`   Redirect URL: ${transaction.redirect_url}`);

    // Return success response
    return res.json({
        success: true,
        snapToken: transaction.token,
        redirectUrl: transaction.redirect_url,
        orderId: orderId,
        orderNumber: order.invoice_number,
    });
}

// =============================================
// CHECK PAYMENT STATUS (New functionality)
// =============================================
async function checkPaymentStatus({ orderId, res, log, error }) {
    log(`🔍 Checking payment status for order: ${orderId}`);

    // Initialize Appwrite client
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
        .setProject(process.env.APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    // Get order from database
    log('📖 Fetching order from database...');
    const order = await databases.getDocument(
        process.env.DATABASE_ID,
        process.env.ORDERS_COLLECTION_ID,
        orderId
    );

    if (!order) {
        error(`Order not found: ${orderId}`);
        return res.json({ error: 'Order not found' }, 404);
    }

    const invoiceNumber = order.invoice_number;
    log(`🧾 Invoice number: ${invoiceNumber}`);
    log(`📊 Current order status: ${order.order_status}`);

    // Initialize Midtrans Core API client
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const coreApi = new midtransClient.CoreApi({
        isProduction,
        serverKey: process.env.MIDTRANS_SERVER_KEY,
        clientKey: process.env.MIDTRANS_CLIENT_KEY
    });

    log(`🔌 Querying Midtrans Transaction Status API for: ${invoiceNumber}`);

    // Get transaction status from Midtrans
    const statusResponse = await coreApi.transaction.status(invoiceNumber);

    log(`📥 Midtrans response received`);
    log(`   Transaction Status: ${statusResponse.transaction_status}`);
    log(`   Payment Type: ${statusResponse.payment_type}`);
    log(`   Gross Amount: ${statusResponse.gross_amount}`);
    log(`   Status Code: ${statusResponse.status_code}`);

    // Map Midtrans status to order status
    let orderStatus = order.order_status; // Keep current if no change needed
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    if (transactionStatus === 'capture') {
        orderStatus = fraudStatus === 'accept' ? 'confirmed' : 'pending_payment';
    } else if (transactionStatus === 'settlement') {
        orderStatus = 'confirmed';
    } else if (transactionStatus === 'pending') {
        orderStatus = 'pending_payment';
    } else if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
        orderStatus = 'cancelled';
    }

    log(`🎯 Mapped order status: ${orderStatus}`);

    // Update order if status changed
    if (orderStatus !== order.order_status) {
        log(`💾 Updating order status from "${order.order_status}" to "${orderStatus}"`);

        await databases.updateDocument(
            process.env.DATABASE_ID,
            process.env.ORDERS_COLLECTION_ID,
            orderId,
            { order_status: orderStatus }
        );

        log('✅ Order status updated successfully');
    } else {
        log('ℹ️  Order status unchanged, no update needed');
    }

    // Return response
    return res.json({
        success: true,
        orderId,
        invoiceNumber,
        transactionStatus: statusResponse.transaction_status,
        orderStatus,
        paymentType: statusResponse.payment_type,
        grossAmount: statusResponse.gross_amount,
        updatedAt: new Date().toISOString()
    });
}
