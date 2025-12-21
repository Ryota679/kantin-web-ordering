// Utility Functions

// Validate tenant code exists
async function validateTenant(tenantCode) {
    try {
        const response = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.tenants,
            [
                Appwrite.Query.equal('tenant_code', tenantCode),
                Appwrite.Query.limit(1)
            ]
        );

        return response.documents.length > 0;
    } catch (error) {
        console.error('Error validating tenant:', error);
        return false;
    }
}

// Get products by tenant
async function getProductsByTenant(tenantCode) {
    try {
        // First get tenant ID
        const tenantResponse = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.tenants,
            [
                Appwrite.Query.equal('tenant_code', tenantCode),
                Appwrite.Query.limit(1)
            ]
        );

        if (tenantResponse.documents.length === 0) {
            throw new Error('Tenant not found');
        }

        const tenantId = tenantResponse.documents[0].$id;

        // Get products for this tenant
        const productsResponse = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.products,
            [
                Appwrite.Query.equal('tenant_id', tenantId),
                Appwrite.Query.equal('is_available', true),
                Appwrite.Query.orderAsc('name')
            ]
        );

        return productsResponse.documents;
    } catch (error) {
        console.error('Error getting products:', error);
        throw error;
    }
}

// Create order
async function createOrder(orderData) {
    try {
        const response = await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.orders,
            Appwrite.ID.unique(),
            orderData
        );

        return response;
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
}

// Get order by invoice
async function getOrderByInvoice(invoiceNumber) {
    try {
        const response = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.orders,
            [
                Appwrite.Query.equal('invoice_number', invoiceNumber.toUpperCase()),
                Appwrite.Query.limit(1)
            ]
        );

        if (response.documents.length === 0) {
            return null;
        }

        return response.documents[0];
    } catch (error) {
        console.error('Error getting order:', error);
        return null;
    }
}

// Format currency
function formatRupiah(amount) {
    return 'Rp ' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Get current tenant code from URL
function getCurrentTenant() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tenant');
}

// Cart management (localStorage)
const Cart = {
    getKey(tenantCode) {
        return `cart_${tenantCode}`;
    },

    get(tenantCode) {
        const data = localStorage.getItem(this.getKey(tenantCode));
        return data ? JSON.parse(data) : [];
    },

    save(tenantCode, items) {
        localStorage.setItem(this.getKey(tenantCode), JSON.stringify(items));
    },

    clear(tenantCode) {
        localStorage.removeItem(this.getKey(tenantCode));
    },

    add(tenantCode, product, quantity = 1) {
        const cart = this.get(tenantCode);
        const existingIndex = cart.findIndex(item => item.product_id === product.$id);

        if (existingIndex >= 0) {
            cart[existingIndex].quantity += quantity;
        } else {
            cart.push({
                product_id: product.$id,
                product_name: product.name,
                price: product.price,
                quantity: quantity,
                image_url: product.image_url || null,
                notes: null
            });
        }

        this.save(tenantCode, cart);
        return cart;
    },

    remove(tenantCode, productId) {
        let cart = this.get(tenantCode);
        cart = cart.filter(item => item.product_id !== productId);
        this.save(tenantCode, cart);
        return cart;
    },

    updateQuantity(tenantCode, productId, quantity) {
        const cart = this.get(tenantCode);
        const item = cart.find(item => item.product_id === productId);

        if (item) {
            if (quantity <= 0) {
                return this.remove(tenantCode, productId);
            }
            item.quantity = quantity;
            this.save(tenantCode, cart);
        }

        return cart;
    },

    getTotal(tenantCode) {
        const cart = this.get(tenantCode);
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    getCount(tenantCode) {
        const cart = this.get(tenantCode);
        return cart.reduce((count, item) => count + item.quantity, 0);
    }
};
