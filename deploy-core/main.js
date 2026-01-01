const midtransClient = require('midtrans-client');

// Initialize Core API client
const coreApi = new midtransClient.CoreApi({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

async function chargeGoPay(invoiceNumber, totalAmount, log) {
    const parameter = {
        payment_type: 'gopay',
        transaction_details: {
            order_id: invoiceNumber,
            gross_amount: totalAmount
        },
        gopay: {
            enable_callback: true,
            callback_url: `${process.env.WEB_CALLBACK_URL || 'https://kantin-web-ordering.vercel.app'}/payment-callback.html`
        }
    };

    log('📱 Charging GoPay...');
    log(`DEBUG - GoPay Parameter: ${JSON.stringify(parameter, null, 2)}`);

    try {
        const charge = await coreApi.charge(parameter);
        log(`DEBUG - GoPay Response: ${JSON.stringify(charge, null, 2)}`);
        return {
            type: 'redirect',
            redirectUrl: charge.actions.find(a => a.name === 'deeplink-redirect')?.url || charge.actions.find(a => a.name === 'generate-qr-code')?.url,
            expiryTime: charge.expiry_time || null
        };
    } catch (err) {
        log(`ERROR - GoPay Failed: ${err.message}`);
        log(`ERROR - Full Error: ${JSON.stringify(err, null, 2)}`);
        throw err;
    }
}

async function chargeQRIS(invoiceNumber, totalAmount, log) {
    const parameter = {
        payment_type: 'qris',
        transaction_details: {
            order_id: invoiceNumber,
            gross_amount: totalAmount
        }
    };

    log('🔲 Charging QRIS...');
    log(`DEBUG - QRIS Parameter: ${JSON.stringify(parameter, null, 2)}`);

    try {
        const charge = await coreApi.charge(parameter);
        log(`DEBUG - QRIS Response: ${JSON.stringify(charge, null, 2)}`);
        return {
            type: 'qr',
            qrString: charge.qr_string,
            expiryTime: charge.expiry_time || null
        };
    } catch (err) {
        log(`ERROR - QRIS Failed: ${err.message}`);
        log(`ERROR - Full Error: ${JSON.stringify(err, null, 2)}`);
        throw err;
    }
}

async function chargeVirtualAccount(invoiceNumber, totalAmount, bank, log) {
    const parameter = {
        payment_type: 'bank_transfer',
        transaction_details: {
            order_id: invoiceNumber,
            gross_amount: totalAmount
        },
        bank_transfer: {
            bank: bank
        }
    };

    log(`🏦 Charging ${bank.toUpperCase()} VA...`);
    log(`DEBUG - ${bank.toUpperCase()} VA Parameter: ${JSON.stringify(parameter, null, 2)}`);

    try {
        const charge = await coreApi.charge(parameter);
        log(`DEBUG - ${bank.toUpperCase()} VA Response: ${JSON.stringify(charge, null, 2)}`);
        return {
            type: 'va',
            vaNumber: charge.va_numbers[0].va_number,
            bank: bank.toUpperCase(),
            expiryTime: charge.expiry_time || null
        };
    } catch (err) {
        log(`ERROR - ${bank.toUpperCase()} VA Failed: ${err.message}`);
        log(`ERROR - Full Error: ${JSON.stringify(err, null, 2)}`);
        throw err;
    }
}

module.exports = async ({ req, res, log, error }) => {
    try {
        log('📥 ============ REQUEST START ============');
        log(`Environment: ${process.env.MIDTRANS_IS_PRODUCTION === 'true' ? 'PRODUCTION' : 'SANDBOX'}`);
        log(`Server Key (last 4): ...${process.env.MIDTRANS_SERVER_KEY?.slice(-4)}`);

        // Simplified body parsing for Appwrite
        const bodyString = req.bodyRaw || req.body || '{}';

        let parsedBody;
        try {
            parsedBody = typeof bodyString === 'string' ? JSON.parse(bodyString) : bodyString;
        } catch (e) {
            parsedBody = {};
        }

        // Handle double-wrapped body from Appwrite SDK
        const body = parsedBody.body ? JSON.parse(parsedBody.body) : parsedBody;

        const { invoiceNumber, totalAmount, paymentMethod } = body;

        log('💳 Payment request received');
        log(`📄 Invoice: ${invoiceNumber}`);
        log(`💵 Amount: ${totalAmount}`);
        log(`💰 Method: ${paymentMethod}`);

        if (!invoiceNumber || !totalAmount || !paymentMethod) {
            error('❌ Missing required parameters');
            return res.json({
                success: false,
                error: 'invoiceNumber, totalAmount, and paymentMethod are required'
            }, 400);
        }

        // Route to specific payment method
        let chargeResult;

        log(`🔀 Routing to payment method: ${paymentMethod}`);

        switch (paymentMethod) {
            case 'gopay':
                chargeResult = await chargeGoPay(invoiceNumber, totalAmount, log);
                break;
            case 'qris':
                chargeResult = await chargeQRIS(invoiceNumber, totalAmount, log);
                break;
            case 'bsi':
            case 'cimb':
            case 'bni':
            case 'bri':
            case 'mandiri':
            case 'permata':
                chargeResult = await chargeVirtualAccount(invoiceNumber, totalAmount, paymentMethod, log);
                break;
            default:
                error(`❌ Unsupported payment method: ${paymentMethod}`);
                return res.json({
                    success: false,
                    error: `Payment method '${paymentMethod}' not supported`
                }, 400);
        }

        log('✅ Payment charge successful');
        log(`DEBUG - Charge Result: ${JSON.stringify(chargeResult, null, 2)}`);
        log('============ REQUEST END ============');

        return res.json({
            success: true,
            orderNumber: invoiceNumber,
            paymentData: chargeResult
        });

    } catch (err) {
        error(`❌ FATAL Error: ${err.message}`);
        error(`Stack: ${err.stack}`);
        if (err.ApiResponse) {
            error(`API Response: ${JSON.stringify(err.ApiResponse, null, 2)}`);
        }

        return res.json({
            success: false,
            error: err.message
        }, 500);
    }
};
