# Deployment README

## Files dalam folder ini:

- `main.js` - Function code dengan web callback URL support
- `package.json` - Dependencies

## Cara Deploy:

### Option 1: Upload Manual (RECOMMENDED)

1. **Buka Appwrite Console**: https://cloud.appwrite.io/console
2. **Go to Functions** → `create-midtrans-payment`
3. **Klik "Create deployment"** (tombol pink)
4. **Manual upload**
5. **Select files:**
   - `main.js`
   - `package.json`
6. **Create**
7. **Wait** sampai status "Ready"
8. **Activate deployment**

### Option 2: Upload ZIP/TAR.GZ

1. Compress `main.js` dan `package.json` jadi **tar.gz**
2. Upload ke Appwrite Console

## Environment Variables Required:

Set di Appwrite Console → Function Settings → Variables:

```
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=perojek-pml
APPWRITE_API_KEY=[get from Settings → API Keys]
DATABASE_ID=kantin-db
ORDERS_COLLECTION_ID=orders
MIDTRANS_SERVER_KEY=[from Midtrans dashboard]
MIDTRANS_CLIENT_KEY=[from Midtrans dashboard]
MIDTRANS_IS_PRODUCTION=false
WEB_CALLBACK_URL=http://localhost:8080
```

## What's New:

✅ Support untuk web dan mobile
✅ Dynamic callback URL berdasarkan platform
✅ Enhanced error handling
✅ Better logging
✅ Return format yang lebih structured

## Testing:

Setelah deploy, test dengan:

**Web Request:**
```json
{
  "orderId": "xxx",
  "platform": "web"
}
```

**Mobile Request:**
```json
{
  "orderId": "xxx"
}
```

## Version: 2.0.0
