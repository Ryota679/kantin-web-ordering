# Midtrans Payment Integration - Web Project Briefing

## Task Overview

Integrate Midtrans payment gateway into existing **kantin-web-ordering** web application (HTML/CSS/JavaScript).

**Project Location:** `C:\kantin-web-ordering`

---

## Background Context

### **System Architecture:**

1. **Web App (Customer):** HTML/CSS/JS → Customer orders via browser (QR scan)
2. **Flutter App (Tenant):** Mobile app for business owners (separate project)
3. **Backend:** Appwrite (Database + Functions)
4. **Payment:** Midtrans Sandbox

### **Current Status:**

- ✅ Web app exists with order flow (menu → cart → checkout)
- ✅ Backend Appwrite functions for payment are READY
- ❌ NO payment integration yet (manual payment only)
- 🎯 **Goal:** Add Midtrans payment to checkout flow

---

## Backend Functions (Already Built & Deployed)

### **Appwrite Configuration:**

```
Endpoint: https://fra.cloud.appwrite.io/v1
Project ID: [Check user's Appwrite console]
Function ID: 694e87c088293c6fd5a7 (create-midtrans-payment)
```

### **Function 1: Create Payment**

**Endpoint:** `POST https://fra.cloud.appwrite.io/v1/functions/694e87c088293c6fd5a7/executions`

**Request Headers:**
```javascript
{
  'Content-Type': 'application/json',
  'X-Appwrite-Project': 'YOUR_PROJECT_ID'
}
```

**Request Body:**
```json
{
  "orderId": "ORDER_DOCUMENT_ID"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "snapToken": "abc123...",
    "redirectUrl": "https://app.sandbox.midtrans.com/snap/v4/redirection/...",
    "orderId": "694e9ff90008d656c1d7",
    "orderNumber": "INV-20251226-P3QAYVO"
  },
  "metadata": {
    "timestamp": "2025-12-28T..."
  }
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": {
    "code": "ORDER_ALREADY_PAID",
    "message": "This order has already been paid"
  }
}
```

---

### **Function 2: Check Payment Status**

**Request Body:**
```json
{
  "action": "checkStatus",
  "orderId": "ORDER_DOCUMENT_ID"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "orderId": "...",
    "orderStatus": "confirmed",
    "transactionStatus": "settlement",
    "paymentType": "credit_card"
  }
}
```

**Order Status Values:**
- `pending_payment` - Not yet paid
- `confirmed` - Payment successful
- `cancelled` - Payment failed/cancelled

---

## Implementation Requirements

### **User Flow:**

```
Customer fills checkout form →
Click "Bayar Sekarang" →
Call create-payment function →
Redirect to Midtrans Snap (redirectUrl) →
Customer pays (Sandbox test card) →
Midtrans redirects back to callback page →
Check payment status →
Show success/failed page
```

---

### **Files to Modify/Create:**

#### **1. Modify `checkout.html`**

**Add payment button after order submission:**
```html
<button id="payNowBtn" class="btn btn-primary">
  Bayar Sekarang
</button>
```

**Or modify existing submit button to trigger payment flow**

---

#### **2. Create/Modify `js/payment.js` (or add to `app.js`)**

**Functions needed:**

```javascript
async function createPayment(orderId) {
  try {
    const response = await fetch(
      `${APPWRITE_ENDPOINT}/functions/${PAYMENT_FUNCTION_ID}/executions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        },
        body: JSON.stringify({ orderId })
      }
    );

    const execution = await response.json();
    const result = JSON.parse(execution.responseBody);

    if (result.success) {
      // Redirect to Midtrans
      window.location.href = result.data.redirectUrl;
    } else {
      throw new Error(result.error.message);
    }
  } catch (error) {
    console.error('Payment error:', error);
    alert('Gagal membuat pembayaran: ' + error.message);
  }
}

async function checkPaymentStatus(orderId) {
  try {
    const response = await fetch(
      `${APPWRITE_ENDPOINT}/functions/${PAYMENT_FUNCTION_ID}/executions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        },
        body: JSON.stringify({ 
          action: 'checkStatus',
          orderId 
        })
      }
    );

    const execution = await response.json();
    const result = JSON.parse(execution.responseBody);

    return result.data;
  } catch (error) {
    console.error('Status check error:', error);
    throw error;
  }
}
```

---

#### **3. Create `payment-callback.html`**

**Handles redirect from Midtrans:**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Processing Payment...</title>
</head>
<body>
  <div class="container">
    <h2>Checking payment status...</h2>
    <div class="loader"></div>
  </div>

  <script src="js/config.js"></script>
  <script src="js/payment.js"></script>
  <script>
    // Get order ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');

    if (!orderId) {
      alert('Invalid order ID');
      window.location.href = 'index.html';
    }

    // Check payment status
    checkPaymentStatus(orderId).then(status => {
      if (status.orderStatus === 'confirmed') {
        window.location.href = `payment-success.html?order_id=${orderId}`;
      } else {
        window.location.href = `payment-failed.html?order_id=${orderId}`;
      }
    }).catch(error => {
      window.location.href = `payment-failed.html?order_id=${orderId}`;
    });
  </script>
</body>
</html>
```

---

#### **4. Create `payment-success.html`**

Success page with:
- ✅ Payment successful message
- Order details
- "Lihat Pesanan" button → tracking page
- "Order Lagi" button → menu page

---

#### **5. Create `payment-failed.html`**

Failed page with:
- ❌ Payment failed message
- Reason (if available)
- "Coba Lagi" button → back to checkout
- "Kembali" button → menu page

---

#### **6. Update `js/config.js`**

**Add payment function ID:**
```javascript
const PAYMENT_FUNCTION_ID = '694e87c088293c6fd5a7';
```

---

## Midtrans Callback URL Configuration

**Currently in backend function:**
```javascript
callbacks: {
  finish: `myapp://payment/finish?order_id=${orderId}`
}
```

**Need to change to web URL:**
```javascript
callbacks: {
  finish: `https://your-domain.com/payment-callback.html?order_id=${orderId}`
}
```

**For local testing:**
```javascript
callbacks: {
  finish: `http://localhost:8080/payment-callback.html?order_id=${orderId}`
}
```

**Note:** This requires modifying backend function in the other project (PML_7-1).

---

## Testing

### **Test Cards (Sandbox):**

**Success:**
- Card: `4811 1111 1111 1114`
- CVV: `123`
- Expiry: Any future date

**Failed:**
- Card: `4911 1111 1111 1113`

### **Testing Flow:**

1. Run local server: `python -m http.server 8080`
2. Open: `http://localhost:8080`
3. Scan QR or input tenant code
4. Add items to cart
5. Checkout → Fill form
6. Click "Bayar Sekarang"
7. Pay with test card
8. Verify redirected to success page
9. Check order in database → status should be `confirmed`

---

## Important Notes

1. **Function is production-ready** with:
   - ✅ Retry logic
   - ✅ Input validation
   - ✅ Error handling
   - ✅ Request tracking

2. **Midtrans is in Sandbox mode**
   - Only test cards work
   - Real money NOT charged

3. **Order status mapping:**
   - Midtrans `settlement`/`capture` → Appwrite `confirmed`
   - Midtrans `pending` → Appwrite `pending_payment`
   - Midtrans `deny`/`cancel` → Appwrite `cancelled`

4. **Webhook is optional**
   - Current implementation uses app-based status check
   - More reliable than webhook

---

## Existing Web App Structure

```
kantin-web-ordering/
├── css/
│   └── style.css
├── js/
│   ├── app.js           # Main utilities
│   ├── config.js        # Appwrite config
│   └── invoice-service.js
├── cart.html            # Cart page
├── checkout.html        # Checkout page
├── index.html           # Landing (QR scan)
├── info.html
├── menu.html            # Menu browse
├── tracking.html        # Order tracking
└── README.md
```

**Current flow:** Landing → Menu → Cart → Checkout → (Manual payment)

**New flow:** Landing → Menu → Cart → Checkout → **Payment** → Success/Failed

---

## Step-by-Step Implementation

1. **Review existing code**
   - Check `checkout.html` current submit flow
   - Check `js/config.js` for Appwrite config
   - Check `js/app.js` existing functions

2. **Add payment functions**
   - Create `js/payment.js` OR add to `app.js`
   - Implement `createPayment()` and `checkPaymentStatus()`

3. **Modify checkout page**
   - Add "Bayar Sekarang" button
   - Wire up payment function

4. **Create callback pages**
   - `payment-callback.html` (processing)
   - `payment-success.html` (success)
   - `payment-failed.html` (failed)

5. **Test locally**
   - Local server
   - Full flow test with test card

6. **Update callback URL in backend**
   - Change from `myapp://` to actual web URL
   - Redeploy backend function (in other project)

---

## Success Criteria

✅ Customer can click "Bayar Sekarang" and see Midtrans payment page
✅ After payment, customer redirected to callback page
✅ Status checked automatically
✅ Success/failed page displayed correctly
✅ Order status in database updated to `confirmed`
✅ No errors in console

---

## Questions to Ask User

1. What is the Appwrite Project ID? (Check console)
2. What will be the production URL? (for callback configuration)
3. Should payment be optional or required before order submit?
4. Any specific styling/branding requirements?

---

## Ready to Start!

Open workspace: `C:\kantin-web-ordering`

Start with reviewing existing code, then implement payment integration step by step.

Good luck! 🚀
