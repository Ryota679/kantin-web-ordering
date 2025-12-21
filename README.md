# 🌐 Web Ordering Application

Web ordering system untuk Kantin App - memungkinkan customer order makanan via browser tanpa install aplikasi.

## 📁 Struktur Project

```
web_ordering/
├── index.html          # Landing page (scan QR / input kode)
├── menu.html           # Browse menu & add to cart
├── cart.html           # Review cart & manage items
├── checkout.html       # Customer info & submit order
├── tracking.html       # Track order status
├── css/
│   └── style.css       # Semua styling
└── js/
    ├── config.js       # Appwrite configuration
    ├── app.js          # Main utilities & functions
    └── invoice-service.js  # Invoice generation
```

## 🚀 Quick Start

### 1. Setup Appwrite Platform

1. Login ke [Appwrite Console](https://fra.cloud.appwrite.io)
2. Buka project **"perojek-pml"**
3. Settings → **Add Platform** → **Web App**
   - Name: `Web Ordering`
   - Hostname: `localhost` (untuk development)
   - Hostname: `*.vercel.app` (untuk production)

### 2. Test Locally

1. Buka folder `web_ordering` di VS Code
2. Install extension: **Live Server**
3. Right-click `index.html` → **Open with Live Server**
4. Browser otomatis buka: `http://localhost:5500`

### 3. Testing Flow

1. **Landing Page**: Masukkan tenant code (contoh: `Q8L2PH`)
2. **Menu Page**: Browse produk, klik "+ Keranjang"
3. **Cart Page**: Review cart, ubah quantity
4. **Checkout**: Isi customer info, submit order
5. **Tracking**: Track order dengan invoice number

## 🔧 Configuration

File `js/config.js` sudah dikonfigurasi dengan:

```javascript
PROJECT_ID: perojek-pml
ENDPOINT: https://fra.cloud.appwrite.io/v1
DATABASE_ID: kantin-db
COLLECTIONS:
  - orders
  - products
  - tenants
```

✅ **Sudah siap pakai, tidak perlu diubah!**

## 📱 QR Code Support

URL format untuk QR code:
```
https://your-domain.vercel.app/?t=Q8L2PH
```

Customer scan QR → Auto redirect ke menu page.

## 📦 Deploy ke Vercel

### Preparation:

1. Pindahkan folder `web_ordering` **KELUAR** dari `kantin_app`
2. Rename menjadi `kantin-web-ordering`

### Deployment:

```bash
cd kantin-web-ordering

# Init git
git init
git add .
git commit -m "Initial commit: Web ordering app"

# Create repo di GitHub dulu!
# Nama: kantin-web-ordering

git remote add origin https://github.com/YOUR_USERNAME/kantin-web-ordering.git
git push -u origin main
```

### Connect to Vercel:

1. Login [Vercel](https://vercel.com)
2. Click **"Add New Project"**
3. **Import Git Repository** → Pilih `kantin-web-ordering`
4. Vercel auto-detect settings (no build needed for static HTML!)
5. Click **"Deploy"**
6. ✅ **DONE!** Copy deployment URL

### Update QR Code:

Setelah dapat URL dari Vercel (contoh: `kantin-web-ordering.vercel.app`):

1. Buka Flutter app
2. Update QR code generator dengan URL tersebut
3. Generate QR baru
4. ✅ Customer scan → redirect ke web ordering!

## 🧪 Testing Checklist

- [ ] Landing page tampil dengan benar
- [ ] Validasi tenant code works
- [ ] Menu page load products dari Appwrite
- [ ] Add to cart works (check localStorage)
- [ ] Cart persistence (refresh page)
- [ ] Checkout form validation
- [ ] Order creation successful
- [ ] Invoice generation unique
- [ ] Order tracking works
- [ ] Responsive di mobile

## ⚠️ Important Notes

### TIER 1 (Current):
- ✅ Manual payment (tenant confirm)
- ✅ order_status: pending, paid, preparing, ready, completed
- ❌ NO Midtrans integration yet

### TIER 2 (After Midtrans approved):
- Add payment integration
- Add payment_status field
- Integrate payment webhook

## 🐛 Troubleshooting

### Products tidak muncul
- Check browser console untuk error
- Verify tenant_code exists di database
- Check products collection ada data

### Cannot create order
- Check browser console error message
- Verify database permissions di Appwrite
- Check invoice_number unique constraint

### LocalStorage cart kosong
- Check browser private/incognito mode
- Verify tenant_code correct

## 📝 Next Steps

1. ✅ Test locally dengan Live Server
2. ✅ Verify semua fitur works
3. ✅ Deploy ke Vercel
4. ✅ Update QR code di Flutter app
5. ✅ Test end-to-end dengan real QR scan

## 🎯 Features

- ✅ QR code scanning support
- ✅ Guest ordering (no login required)
- ✅ Cart persistence (localStorage)
- ✅ Unique invoice generation
- ✅ Real-time order tracking
- ✅ Responsive design (mobile-first)
- ✅ Connected to Appwrite (same database as mobile app)

---

**Good luck! 🚀**
