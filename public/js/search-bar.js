/**
 * SEARCH BAR UI LOGIC
 * 
 * Handles user interaction with search bar
 * Features: Debouncing (280ms), Memory Caching, Enter key support
 * 
 * Dependencies: levenshtein.js must be loaded first
 */

// ============================================
// DEBUG CONFIGURATION
// ============================================

/**
 * Debug mode flag
 * Set to true to enable console logging for development
 * Set to false for production (hides all debug output)
 */
const kDebugMode = true; // WARNING: Set to false for production

// ============================================
// GLOBAL VARIABLES
// ============================================

let allProducts = []; // All products loaded from database
let debounceTimer = null; // Timer for debouncing
const DEBOUNCE_DELAY = 280; // milliseconds
const MIN_SEARCH_LENGTH = 2; // Minimum characters to trigger search

// ============================================
// MEMORY CACHE OBJECT
// ============================================

const searchCache = {
    _data: {},
    _stats: {
        hits: 0,
        misses: 0,
        totalSearches: 0
    },

    /**
     * Get cached results for a query
     * @param {string} key - Search query
     * @returns {Array|null} - Cached results or null
     */
    get(key) {
        const cacheKey = key.toLowerCase().trim();
        this._stats.totalSearches++;

        if (this._data[cacheKey]) {
            this._stats.hits++;
            if (kDebugMode) console.log(`Cache HIT! (${this.getHitRate()}% hit rate)`);
            return this._data[cacheKey];
        } else {
            this._stats.misses++;
            if (kDebugMode) console.log(`Cache MISS (${this.getHitRate()}% hit rate)`);
            return null;
        }
    },

    /**
     * Save results to cache
     * @param {string} key - Search query
     * @param {Array} value - Search results
     */
    set(key, value) {
        const cacheKey = key.toLowerCase().trim();
        this._data[cacheKey] = {
            results: value,
            timestamp: Date.now(),
            accessCount: 1
        };
        if (kDebugMode) console.log(`Cached: "${cacheKey}" (${this.size()} items in cache)`);
    },

    /**
     * Clear all cache
     */
    clear() {
        this._data = {};
        this._stats = { hits: 0, misses: 0, totalSearches: 0 };
        if (kDebugMode) console.log('Cache cleared');
    },

    /**
     * Get cache size
     * @returns {number}
     */
    size() {
        return Object.keys(this._data).length;
    },

    /**
     * Get hit rate percentage
     * @returns {string}
     */
    getHitRate() {
        if (this._stats.totalSearches === 0) return '0.0';
        return ((this._stats.hits / this._stats.totalSearches) * 100).toFixed(1);
    },

    /**
     * Debug info
     */
    debug() {
        if (kDebugMode) {
            console.log('=== Search Cache Debug ===');
            console.log('Size:', this.size(), 'items');
            console.log('Stats:', this._stats);
            console.log('Hit Rate:', this.getHitRate() + '%');
        }
        return {
            size: this.size(),
            stats: this._stats,
            hitRate: this.getHitRate()
        };
    }
};

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize search functionality
 * Called from menu.html after products are loaded
 * @param {Array} products - Array of product objects
 */
function initializeSearch(products) {
    if (kDebugMode) console.log('Initializing search bar...');

    // Store products globally
    allProducts = products || [];
    if (kDebugMode) {
        console.log(`Loaded ${allProducts.length} products for search`);
        console.log('Product names:', allProducts.map(p => p.name).join(', '));
    }

    // Get DOM elements
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');

    if (!searchInput) {
        console.error('Search input not found!');
        return;
    }

    // Add event listeners
    searchInput.addEventListener('input', onSearchInput);
    searchInput.addEventListener('keydown', onSearchKeyDown);
    searchInput.addEventListener('focus', onSearchFocus);
    searchInput.addEventListener('blur', onSearchBlur);

    if (clearBtn) {
        clearBtn.addEventListener('click', clearSearch);
    }

    // Click outside to close dropdown
    document.addEventListener('click', onDocumentClick);

    if (kDebugMode) console.log('Search bar initialized');
}

/**
 * Update products array (call when products are reloaded)
 * @param {Array} products - Updated product array
 */
function updateSearchProducts(products) {
    allProducts = products || [];
    searchCache.clear(); // Clear cache when products change
    if (kDebugMode) console.log(`Updated ${allProducts.length} products for search`);
}

// ============================================
// EVENT HANDLERS
// ============================================

/**
 * Handle search input event (with debouncing)
 * @param {Event} event - Input event
 */
function onSearchInput(event) {
    const query = event.target.value.trim();
    const clearBtn = document.getElementById('clearSearchBtn');

    // Show/hide clear button
    if (clearBtn) {
        clearBtn.style.display = query.length > 0 ? 'flex' : 'none';
    }

    // Clear previous timer
    clearTimeout(debounceTimer);

    // If query too short, hide dropdown
    if (query.length < MIN_SEARCH_LENGTH) {
        hideDropdown();
        return;
    }

    // Show loading indicator
    showLoadingIndicator();

    // Set debounce timer
    debounceTimer = setTimeout(() => {
        performSearch(query);
    }, DEBOUNCE_DELAY);
}

/**
 * Handle keydown event (Enter key bypass)
 * @param {Event} event - Keyboard event
 */
function onSearchKeyDown(event) {
    const query = event.target.value.trim();

    // Enter key - bypass debounce and search immediately
    if (event.key === 'Enter') {
        event.preventDefault();
        clearTimeout(debounceTimer);

        if (query.length >= MIN_SEARCH_LENGTH) {
            performSearch(query);
        }
    }

    // Escape key - close dropdown
    if (event.key === 'Escape') {
        hideDropdown();
        event.target.blur();
    }

    // Arrow down - focus first result
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        const firstResult = document.querySelector('.search-result-item');
        if (firstResult) {
            firstResult.focus();
        }
    }
}

/**
 * Handle focus event
 * @param {Event} event - Focus event
 */
function onSearchFocus(event) {
    const query = event.target.value.trim();

    // If there's already a query, show results
    if (query.length >= MIN_SEARCH_LENGTH) {
        performSearch(query);
    }
}

/**
 * Handle blur event (delayed to allow clicking results)
 * @param {Event} event - Blur event
 */
function onSearchBlur(event) {
    // Delay hiding to allow dropdown clicks
    setTimeout(() => {
        if (!document.querySelector('.search-dropdown:hover')) {
            // Don't hide immediately, let click events fire first
        }
    }, 200);
}

/**
 * Handle document click (close dropdown when clicking outside)
 * @param {Event} event - Click event
 */
function onDocumentClick(event) {
    const searchContainer = document.querySelector('.search-container');

    if (searchContainer && !searchContainer.contains(event.target)) {
        hideDropdown();
    }
}

/**
 * Clear search input and results
 */
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');

    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }

    if (clearBtn) {
        clearBtn.style.display = 'none';
    }

    hideDropdown();
}

// ============================================
// SEARCH LOGIC
// ============================================

/**
 * Perform fuzzy search with caching
 * @param {string} query - Search query
 */
function performSearch(query) {
    const startTime = kDebugMode ? performance.now() : 0;

    if (kDebugMode) {
        console.log('=== Search Started ===');
        console.log('Query:', query);
    }

    // Check cache first
    const cached = searchCache.get(query);
    if (cached) {
        displayResults(cached.results, query);
        if (kDebugMode) {
            const endTime = performance.now();
            console.log(`Search time: ${(endTime - startTime).toFixed(2)}ms (from cache)`);
        }
        return;
    }

    // Calculate Levenshtein distance
    if (kDebugMode) console.log('Calculating Levenshtein Distance...');
    const results = fuzzySearchLevenshtein(query, allProducts, 0.40);

    if (kDebugMode) {
        const endTime = performance.now();
        console.log(`Search time: ${(endTime - startTime).toFixed(2)}ms`);
        console.log(`Found ${results.length} matches`);
        if (results.length > 0) {
            console.log('Top matches:');
            results.forEach((r, idx) => {
                console.log(`  ${idx + 1}. "${r.product.name}" | Type: ${r.matchType} | Distance: ${r.distance} | Confidence: ${(r.confidence * 100).toFixed(0)}%`);
            });
        } else {
            console.log('DEBUG: No matches found. Checking first 3 products...');
            allProducts.slice(0, 3).forEach(p => {
                const norm = p.name.toLowerCase().trim();
                const words = norm.split(/\s+/);
                const dist = levenshteinDistance(query.toLowerCase(), norm);
                const queryThresh = Math.floor(query.length * 0.40);

                console.log(`  "${p.name}" (normalized: "${norm}")`);
                console.log(`    Full string: distance=${dist}, queryThreshold=${queryThresh}, match=${dist <= queryThresh}`);

                // Check word-level matching
                words.forEach((word, idx) => {
                    const wordDist = levenshteinDistance(query.toLowerCase(), word);
                    console.log(`    Word[${idx}] "${word}": distance=${wordDist}, match=${wordDist <= queryThresh}`);
                });
            });
        }
    }

    // Save to cache
    searchCache.set(query, results);

    // Display results
    displayResults(results, query);
}

// ============================================
// UI RENDERING
// ============================================

/**
 * Display search results in dropdown
 * @param {Array} results - Search results from fuzzySearchLevenshtein
 * @param {string} query - Original query
 */
function displayResults(results, query) {
    const dropdown = document.getElementById('searchDropdown');

    if (!dropdown) {
        console.error('Search dropdown not found!');
        return;
    }

    // Show dropdown
    dropdown.style.display = 'block';

    // If no results, show empty state
    if (results.length === 0) {
        dropdown.innerHTML = `
            <div class="search-no-results">
                <div class="search-no-results-icon">&#128269;</div>
                <div class="search-no-results-text">Tidak ada hasil</div>
                <div class="search-no-results-hint">Coba kata kunci lain</div>
            </div>
        `;
        return;
    }

    // Render results
    const resultsHTML = results.map(result => {
        const product = result.product;
        const price = formatRupiah(product.price);
        const similarity = Math.round(result.similarity * 100);

        return `
            <div class="search-result-item" onclick="openProductFromSearch('${product.$id}')" tabindex="0">
                <div class="search-result-info">
                    <div class="search-result-name">${product.name}</div>
                    <div class="search-result-meta">
                        <span>Stok: ${product.stock !== null ? product.stock : '∞'}</span>
                        <span class="search-result-similarity">${similarity}% cocok</span>
                    </div>
                </div>
                <div class="search-result-price">${price}</div>
            </div>
        `;
    }).join('');

    dropdown.innerHTML = `<div class="search-results">${resultsHTML}</div>`;

    // Add keyboard navigation to results
    addKeyboardNavigationToResults();
}

/**
 * Show loading indicator in dropdown
 */
function showLoadingIndicator() {
    const dropdown = document.getElementById('searchDropdown');

    if (!dropdown) return;

    dropdown.style.display = 'block';
    dropdown.innerHTML = `
        <div class="search-loading">
            <div class="search-spinner"></div>
            <span>Mencari</span>
        </div>
    `;
}

/**
 * Hide dropdown
 */
function hideDropdown() {
    const dropdown = document.getElementById('searchDropdown');

    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

/**
 * Add keyboard navigation to search results
 */
function addKeyboardNavigationToResults() {
    const items = document.querySelectorAll('.search-result-item');

    items.forEach((item, index) => {
        item.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' && items[index + 1]) {
                e.preventDefault();
                items[index + 1].focus();
            } else if (e.key === 'ArrowUp' && items[index - 1]) {
                e.preventDefault();
                items[index - 1].focus();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                item.click();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
                hideDropdown();
            }
        });
    });
}

// ============================================
// PRODUCT INTERACTION
// ============================================

/**
 * Open product modal from search result
 * @param {string} productId - Product ID
 */
function openProductFromSearch(productId) {
    if (kDebugMode) console.log('Opening product:', productId);

    // Hide dropdown
    hideDropdown();

    // Call existing openProductModal function from menu.html
    if (typeof openProductModal === 'function') {
        openProductModal(productId);
    } else {
        console.error('openProductModal function not found!');
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format number to Rupiah currency
 * @param {number} number - Amount
 * @returns {string} - Formatted currency
 */
function formatRupiah(number) {
    if (typeof number !== 'number') {
        number = parseInt(number);
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
}

// ============================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================

// Make functions available globally for menu.html to call
window.initializeSearch = initializeSearch;
window.updateSearchProducts = updateSearchProducts;
window.searchCache = searchCache;
