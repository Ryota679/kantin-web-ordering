# Kantin Web Ordering System

Web-based ordering system with Midtrans payment integration for kantin/cafeteria management.

## 📁 Project Structure

```
web_ordering/
├── public/              # Frontend web application
│   ├── index.html      # Landing/main page
│   ├── menu.html       # Menu browsing page
│   ├── cart.html       # Shopping cart
│   ├── checkout.html   # Checkout & payment
│   ├── tracking.html   # Order tracking
│   ├── payment-*.html  # Payment result pages
│   ├── css/           # Stylesheets
│   └── js/            # Frontend JavaScript
│       ├── app.js
│       ├── config.js
│       ├── payment.js
│       └── ...
├── functions/          # Appwrite Cloud Functions
│   ├── payment/       # Main payment function
│   ├── payment-core/  # Core payment API
│   └── webhook/       # Payment webhook handler
├── docs/              # Documentation
├── archives/          # Deployment archives (.tar.gz)
├── package.json
├── .gitignore
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (for local development)
- Appwrite account & project
- Midtrans account (sandbox or production)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ryota679/kantin-web-ordering.git
   cd web_ordering
   ```

2. **Configure Appwrite Functions**
   - Deploy functions from `functions/` directory to your Appwrite project
   - Set up environment variables (see Environment Variables section)

3. **Update frontend configuration**
   - Edit `public/js/config.js` with your Appwrite and Midtrans credentials

4. **Deploy**
   - Upload `public/` folder to your web hosting or use Appwrite Static Sites

## 🔧 Environment Variables

Configure these in your Appwrite Cloud Functions:

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

## 💳 Payment Integration

### Create Payment

**Request:**
```json
{
  "orderId": "694e9ff90008d656c1d7"
}
```

**Response:**
```json
{
  "success": true,
  "snapToken": "abc123...",
  "redirectUrl": "https://app.sandbox.midtrans.com/snap/v4/redirection/...",
  "orderId": "694e9ff90008d656c1d7",
  "orderNumber": "INV-20250101-123456"
}
```

### Check Payment Status

**Request:**
```json
{
  "action": "checkStatus",
  "orderId": "694e9ff90008d656c1d7"
}
```

**Response:**
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

## 📚 Documentation

See `docs/` folder for detailed documentation on:
- Payment integration
- API endpoints
- Deployment guides

## 🛠️ Development

```bash
# Install dependencies (if needed)
npm install

# For local development, use a local server
# Example with Python:
cd public
python -m http.server 8000

# Or with Node.js http-server:
npx http-server public
```

## 📝 License

This project is for educational/business purposes.

## 🤝 Contributing

For contribution guidelines, please contact the repository owner.
