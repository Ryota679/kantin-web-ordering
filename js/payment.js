/**
 * Create Midtrans payment for an order using Core API
 * @param {string} invoiceNumber - Order invoice number
 * @param {number} totalAmount - Total amount to charge
 * @param {string} paymentMethod - Selected payment method (gopay, qris, bca, etc)
 * @returns {Promise<Object>} Payment data
 */
async function createPayment(invoiceNumber, totalAmount, paymentMethod) {
    try {
        const response = await fetch(
            `${APPWRITE_CONFIG.endpoint}/functions/${PAYMENT_FUNCTION_ID}/executions`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Appwrite-Project': APPWRITE_CONFIG.projectId,
                },
                body: JSON.stringify({
                    body: JSON.stringify({
                        invoiceNumber: invoiceNumber,
                        totalAmount: totalAmount,
                        paymentMethod: paymentMethod,
                        platform: 'web'
                    })
                })
            }
        );

        const execution = await response.json();

        // Check if response is an error from Appwrite API
        if (execution.code && execution.type) {
            throw new Error(`${execution.message} (${execution.type})`);
        }

        // Parse the response body from function execution
        if (!execution.responseBody) {
            throw new Error('Function execution failed - no response body');
        }

        const result = JSON.parse(execution.responseBody);

        if (result.success && result.paymentData) {
            const paymentData = result.paymentData;

            // Handle different payment types
            switch (paymentData.type) {
                case 'redirect':
                    // GoPay, ShopeePay - redirect to payment page/app
                    window.location.href = paymentData.redirectUrl;
                    break;

                case 'qr':
                    // QRIS - show QR code
                    showQRCodePayment(paymentData, result.orderNumber);
                    break;

                case 'va':
                    // Virtual Account - show VA number
                    showVirtualAccountPayment(paymentData, result.orderNumber);
                    break;

                default:
                    throw new Error('Unknown payment type');
            }

            return result;
        } else {
            throw new Error(result.error || 'Failed to create payment');
        }
    } catch (error) {
        throw error;
    }
}

// Show QR Code for QRIS payment
function showQRCodePayment(paymentData, orderNumber) {
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div class="card" style="text-align: center;">
            <h2>Scan QR Code untuk Bayar</h2>
            <p>Order: ${orderNumber}</p>
            <div style="background: white; padding: 20px; border-radius: 12px; display: inline-block; margin: 20px 0;">
                ${paymentData.qrString ? `<div id="qrcode"></div>` : ''}
            </div>
            <p style="color: #666;">Scan QR code ini menggunakan aplikasi e-wallet yang mendukung QRIS</p>
            <button onclick="window.location.href='payment-callback.html?order_id=' + sessionStorage.getItem('currentOrderId')" class="btn btn-primary" style="margin-top: 20px;">
                Saya Sudah Bayar
            </button>
        </div>
    `;

    // Generate QR code if library available
    if (window.QRCode && paymentData.qrString) {
        new QRCode(document.getElementById("qrcode"), {
            text: paymentData.qrString,
            width: 256,
            height: 256
        });
    }
}

// Show Virtual Account number
function showVirtualAccountPayment(paymentData, orderNumber) {
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div class="card" style="text-align: center;">
            <h2>Transfer ke Virtual Account</h2>
            <p>Order: ${orderNumber}</p>
            
            <div style="background: #f8f9fa; padding: 24px; border-radius: 12px; margin: 20px 0;">
                <div style="font-size: 0.9rem; color: #666; margin-bottom: 8px;">
                    ${paymentData.bank} Virtual Account
                </div>
                <div style="font-size: 1.8rem; font-weight: 700; color: #333; letter-spacing: 2px; font-family: monospace;">
                    ${paymentData.vaNumber}
                </div>
                <button onclick="navigator.clipboard.writeText('${paymentData.vaNumber}'); alert('Nomor VA disalin!')" 
                    style="margin-top: 12px; padding: 8px 16px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer;">
                    📋 Salin Nomor
                </button>
            </div>
            
            <div style="text-align: left; background: #fff3cd; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <strong>Cara Bayar:</strong>
                <ol style="margin: 8px 0 0 0; padding-left: 20px;">
                    <li>Buka mobile banking atau ATM ${paymentData.bank}</li>
                    <li>Pilih menu Transfer / Virtual Account</li>
                    <li>Masukkan nomor VA di atas</li>
                    <li>Konfirmasi pembayaran</li>
                </ol>
            </div>
            
            <button onclick="window.location.href='payment-callback.html?order_id=' + sessionStorage.getItem('currentOrderId')" 
                class="btn btn-primary" style="width: 100%;">
                Saya Sudah Bayar
            </button>
        </div>
    `;
}

/**
 * Check payment status for an order
 * @param {string} orderId - Appwrite order document ID
 * @returns {Promise<Object>} Payment status data
 */
async function checkPaymentStatus(orderId) {
    try {
        const response = await fetch(
            `${APPWRITE_CONFIG.endpoint}/functions/${PAYMENT_FUNCTION_ID}/executions`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Appwrite-Project': APPWRITE_CONFIG.projectId,
                },
                body: JSON.stringify({
                    action: 'checkStatus',
                    orderId: orderId
                })
            }
        );

        const execution = await response.json();
        const result = JSON.parse(execution.responseBody);

        if (result.success) {
            return result;
        } else {
            throw new Error(result.error || 'Failed to check payment status');
        }
    } catch (error) {
        console.error('Status check error:', error);
        throw error;
    }
}
