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

// Countdown timer for payment expiry
function startPaymentCountdown(expiryTime, paymentMethod) {
    const DEFAULT_EXPIRY = {
        'qris': 15,      // minutes
        'gopay': 15,     // minutes
        'bni': 1440,     // 24 hours
        'bri': 1440,
        'bsi': 1440,
        'cimb': 1440,
        'mandiri': 1440,
        'permata': 1440
    };

    let expiryDate;

    if (expiryTime) {
        // Parse expiry time from Midtrans (format: "2026-01-01 10:15:00")
        expiryDate = new Date(expiryTime.replace(' ', 'T'));
    } else {
        // Use default expiry durations
        const minutes = DEFAULT_EXPIRY[paymentMethod] || 15;
        expiryDate = new Date(Date.now() + minutes * 60 * 1000);
    }

    function updateCountdown() {
        const now = new Date();
        const diff = expiryDate - now;

        const timerElement = document.getElementById('countdown-timer');
        const textElement = document.getElementById('countdown-text');
        const containerElement = document.getElementById('countdown-container');

        if (!timerElement) return;

        if (diff <= 0) {
            // Expired
            timerElement.textContent = 'EXPIRED';
            textElement.textContent = 'Pembayaran expired';
            containerElement.style.background = '#f44336';
            containerElement.style.color = 'white';

            // Hide QR code
            const qrElement = document.getElementById('qrcode');
            if (qrElement) {
                qrElement.style.opacity = '0.3';
                qrElement.style.pointerEvents = 'none';
            }

            return; // Stop updating
        }

        const totalSeconds = Math.floor(diff / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        // Format display
        let timeDisplay, textDisplay;
        if (hours > 0) {
            timeDisplay = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            textDisplay = `${hours} jam ${minutes} menit ${seconds} detik`;
        } else {
            timeDisplay = `${minutes}:${String(seconds).padStart(2, '0')}`;
            textDisplay = `${minutes} menit ${seconds} detik`;
        }

        timerElement.textContent = timeDisplay;
        textElement.textContent = `Tersisa ${textDisplay}`;

        // Warning color if less than 5 minutes
        if (totalSeconds < 300) { // 5 minutes
            containerElement.style.background = '#ff9800';
            containerElement.style.color = 'white';
            if (!containerElement.querySelector('.warning-icon')) {
                const warningText = containerElement.querySelector('div:first-child');
                warningText.innerHTML = '⚠️ SEGERA BAYAR!';
            }
        }

        // Continue countdown
        setTimeout(updateCountdown, 1000);
    }

    updateCountdown();
}

// Show QR Code for QRIS payment
function showQRCodePayment(paymentData, orderNumber) {
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div class="card" style="text-align: center;">
            <h2>Scan QR Code untuk Bayar</h2>
            <p>Order: ${orderNumber}</p>
            
            <!-- Countdown Timer -->
            <div id="countdown-container" style="background: #fff3cd; padding: 16px; border-radius: 8px; margin: 16px auto; max-width: 400px; transition: all 0.3s;">
                <div style="font-size: 0.9rem; color: #856404; margin-bottom: 8px;">
                    ⏰ Berlaku hingga:
                </div>
                <div id="countdown-timer" style="font-size: 2rem; font-weight: 700; color: #d9534f; margin: 8px 0;">
                    15:00
                </div>
                <div id="countdown-text" style="font-size: 0.85rem; color: #856404;">
                    Tersisa 15 menit
                </div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 12px; display: inline-block; margin: 20px 0;">
                ${paymentData.qrString ? `<div id="qrcode"></div>` : ''}
            </div>
            <p style="color: #666;">Scan QR code ini menggunakan aplikasi e-wallet yang mendukung QRIS</p>
            <p style="color: #999; font-size: 0.9rem; margin-top: 16px;">Status pembayaran akan otomatis ter-update setelah pembayaran berhasil</p>
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

    // Start countdown timer
    startPaymentCountdown(paymentData.expiryTime, 'qris');
}

// Show Virtual Account number
function showVirtualAccountPayment(paymentData, orderNumber) {
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div class="card" style="text-align: center;">
            <h2>Transfer ke Virtual Account</h2>
            <p>Order: ${orderNumber}</p>
            
            <!-- Countdown Timer -->
            <div id="countdown-container" style="background: #e3f2fd; padding: 16px; border-radius: 8px; margin: 16px auto; max-width: 400px; transition: all 0.3s;">
                <div style="font-size: 0.9rem; color: #1565c0; margin-bottom: 8px;">
                    ⏰ Berlaku hingga:
                </div>
                <div id="countdown-timer" style="font-size: 1.5rem; font-weight: 700; color: #1976d2; margin: 8px 0;">
                    23:59:59
                </div>
                <div id="countdown-text" style="font-size: 0.85rem; color: #1565c0;">
                    Tersisa 24 jam
                </div>
            </div>
            
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
            
            <p style="color: #999; font-size: 0.9rem; text-align: center;">Status pembayaran akan otomatis ter-update setelah pembayaran berhasil</p>
        </div>
    `;

    // Start countdown timer
    startPaymentCountdown(paymentData.expiryTime, paymentData.bank.toLowerCase());
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
