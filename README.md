# create-midtrans-payment

Appwrite function for Midtrans payment integration. Supports two modes:
1. **Create Payment** - Generate Snap token for new payment
2. **Check Status** - Query payment status and update order

## Environment Variables

```bash
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
DATABASE_ID=your_database_id
ORDERS_COLLECTION_ID=your_orders_collection_id
MIDTRANS_IS_PRODUCTION=false  # Set to 'true' for production
MIDTRANS_SERVER_KEY=your_server_key
MIDTRANS_CLIENT_KEY=your_client_key
```

---

## Mode 1: Create Payment (Default)

### Request
```json
{
  "orderId": "694e9ff90008d656c1d7"
}
```
Or explicitly:
```json
{
  "action": "create",
  "orderId": "694e9ff90008d656c1d7"
}
```

### Response (200)
```json
{
  "success": true,
  "snapToken": "abc123...",
  "redirectUrl": "https://app.sandbox.midtrans.com/snap/v4/redirection/...",
  "orderId": "694e9ff90008d656c1d7",
  "orderNumber": "INV-20250101-123456"
}
```

---

## Mode 2: Check Payment Status

### Request
```json
{
  "action": "checkStatus",
  "orderId": "694e9ff90008d656c1d7"
}
```

### Response (200)
```json
{
  "success": true,
  "orderId": "694e9ff90008d656c1d7",
  "invoiceNumber": "INV-20250101-123456",
  "transactionStatus": "settlement",
  "orderStatus": "confirmed",
  "paymentType": "credit_card",
  "grossAmount": "125000.00",
  "updatedAt": "2025-12-27T12:00:00.000Z"
}
```

### Status Mapping
| Midtrans Status | Order Status |
|----------------|--------------|
| `settlement` | `confirmed` |
| `capture` (fraud: accept) | `confirmed` |
| `pending` | `pending_payment` |
| `deny`, `cancel`, `expire` | `cancelled` |

---

## Error Response (400/500)
```json
{
  "success": false,
  "error": "Error message"
}
```
