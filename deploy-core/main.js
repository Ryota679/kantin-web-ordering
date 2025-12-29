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
    const charge = await coreApi.charge(parameter);

    return {
        type: 'redirect',
        redirectUrl: charge.actions.find(a => a.name === 'deeplink-redirect')?.url || charge.actions.find(a => a.name === 'generate-qr-code')?.url
    };
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
    const charge = await coreApi.charge(parameter);

    return {
        type: 'qr',
        qrString: charge.qr_string
    };
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
    const charge = await coreApi.charge(parameter);

    return {
        type: 'va',
        vaNumber: charge.va_numbers[0].va_number,
        bank: bank.toUpperCase()
    };
}

async function chargeShopeePay(invoiceNumber, totalAmount, log) {
    const parameter = {
        payment_type: 'shopeepay',
        transaction_details: {
            order_id: invoiceNumber,
            gross_amount: totalAmount
        },
        shopeepay: {
            callback_url: `${process.env.WEB_CALLBACK_URL || 'https://kantin-web-ordering.vercel.app'}/payment-callback.html`
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
        log('📥 Request received');

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

        switch (paymentMethod) {
            case 'gopay':
                chargeResult = await chargeGoPay(invoiceNumber, totalAmount, log);
                break;
            case 'qris':
                chargeResult = await chargeQRIS(invoiceNumber, totalAmount, log);
                break;
            case 'shopeepay':
                chargeResult = await chargeShopeePay(invoiceNumber, totalAmount, log);
                break;
            case 'bca':
            case 'bni':
            case 'bri':
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

        return res.json({
            success: true,
            orderNumber: invoiceNumber,
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
