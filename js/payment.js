// Payment Integration Functions

/**
 * Create Midtrans payment for an order
 * @param {string} orderId - Appwrite order document ID
 * @returns {Promise<Object>} Payment data with snapToken and redirectUrl
 */
async function createPayment(orderId) {
    console.log('📡 createPayment called with orderId:', orderId);
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
                    orderId: orderId,
                    platform: 'web'  // Important: tells backend to use web callback URL
                })
            }
        );

        const execution = await response.json();
        console.log('📡 Execution response:', execution);

        // Check if response is an error from Appwrite API
        if (execution.code && execution.type) {
            // This is an API error, not a function execution
            console.error('❌ Appwrite API Error:', execution);
            throw new Error(`${execution.message} (${execution.type})`);
        }

        // Parse the response body from function execution
        if (!execution.responseBody) {
            console.error('❌ No responseBody in execution');
            throw new Error('Function execution failed - no response body');
        }

        const result = JSON.parse(execution.responseBody);
        console.log('📡 Parsed result:', result);

        if (result.success) {
            return result;
        } else {
            throw new Error(result.error || 'Failed to create payment');
        }
    } catch (error) {
        console.error('Payment error:', error);
        throw error;
    }
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
