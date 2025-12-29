// Appwrite Configuration
const APPWRITE_CONFIG = {
    projectId: 'perojek-pml',
    endpoint: 'https://fra.cloud.appwrite.io/v1',
    databaseId: 'kantin-db',
    collections: {
        orders: 'orders',
        products: 'products',
        tenants: 'tenants',
        categories: 'categories'
    }
};

// Payment Function ID
const PAYMENT_FUNCTION_ID = '694e07e88294f8fa5e7';

// Initialize Appwrite
const { client, databases, account } = initializeAppwrite();

function initializeAppwrite() {
    const client = new Appwrite.Client()
        .setEndpoint(APPWRITE_CONFIG.endpoint)
        .setProject(APPWRITE_CONFIG.projectId);

    const databases = new Appwrite.Databases(client);
    const account = new Appwrite.Account(client);

    return { client, databases, account };
}
