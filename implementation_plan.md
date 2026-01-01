# Implementation Plan: Levenshtein Distance Search Feature

## Goal

Implement smart search functionality on [menu.html](file:///c:/web_ordering/menu.html) using **pure Levenshtein Distance algorithm** (40% threshold) with autocomplete suggestions dropdown, optimized with debouncing (280ms) and memory caching for performance.

## Current Theme Analysis

**Color Scheme (Dark Theme):**
- Primary: `#10B981` (Emerald Green)
- Background: `#0F1419`, `#1A1F2E`, `#232936`
- Text: `#F9FAFB` (white), `#9CA3AF` (gray)
- Border: `#374151`
- Card: `#232936`

**Design Language:**
- Border radius: `12-16px`
- Shadows: `0 4px 6px -1px rgba(0, 0, 0, 0.5)`
- Transitions: `0.3s`
- Font weight: `600-700` for headers

---

## Proposed Changes

### 1. Core Algorithm Files

#### [NEW] `public/js/levenshtein.js`

Pure Levenshtein Distance implementation:

```javascript
/**
 * Calculate Levenshtein Distance between two strings
 * @param {string} source - Source string
 * @param {string} target - Target string
 * @returns {number} - Distance (number of operations needed)
 */
function levenshteinDistance(source, target) {
  // Implementation with DP matrix
  // Returns integer distance
}

/**
 * Fuzzy search products using Levenshtein Distance
 * @param {string} query - Search query
 * @param {Array} products - Product array
 * @param {number} thresholdPercent - Threshold (default 0.40)
 * @returns {Array} - Sorted results by relevance
 */
function fuzzySearchLevenshtein(query, products, thresholdPercent = 0.40) {
  // Filter and sort by distance
  // Return top 5 matches
}
```

---

#### [NEW] `public/js/search-bar.js`

Search UI logic with debouncing and caching:

```javascript
// Memory cache object
const searchCache = {
  _data: {},
  get(key) { },
  set(key, value) { },
  clear() { }
};

// Debounce variables
let debounceTimer;
const DEBOUNCE_DELAY = 280; // ms

// Search functions
function onSearchInput(event) {
  // Handle input with debounce
  // Show loading indicator
}

function performSearch(query) {
  // Check cache first
  // Calculate Levenshtein if miss
  // Display results in dropdown
}

function displaySearchResults(results) {
  // Render dropdown with results
}

function clearSearchResults() {
  // Hide dropdown
}

// Enter key handler
function onSearchKeyDown(event) {
  // If Enter, bypass debounce
}
```

---

### 2. HTML Structure

#### [MODIFY] [public/menu.html](file:///c:/web_ordering/public/menu.html)

Add search bar between the title card and category filter (line ~16):

```html
<!-- Search Bar -->
<div class="search-container">
  <div class="search-wrapper">
    <span class="search-icon">🔍</span>
    <input 
      type="text" 
      id="searchInput" 
      class="search-input"
      placeholder="Cari menu..." 
      autocomplete="off"
      minlength="2"
    >
    <button id="clearSearchBtn" class="search-clear" style="display: none;">×</button>
  </div>
  
  <!-- Dropdown Suggestions -->
  <div id="searchDropdown" class="search-dropdown" style="display: none;">
    <div class="search-results">
      <!-- Results populated by JavaScript -->
    </div>
  </div>
  
  <!-- Search Status -->
  <div id="searchStatus" class="search-status" style="display: none;">
    <span class="search-status-text"></span>
  </div>
</div>
```

**Placement:** After line 16 (after the title card), before category filter (line 18)

---

### 3. CSS Styling

#### [NEW] `public/css/search.css`

Dedicated stylesheet for search components matching dark theme:

```css
/* Search Container */
.search-container {
  margin-bottom: 24px;
  position: relative;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border: 2px solid var(--border-color);
  border-radius: 16px;
  padding: 14px 18px;
  transition: all 0.3s;
}

.search-wrapper:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.search-icon {
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin-right: 12px;
  pointer-events: none;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 1rem;
  color: var(--text-primary);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-clear {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--bg-hover);
  border: none;
  color: var(--text-secondary);
  font-size: 1.3rem;
  cursor: pointer;
  transition: all 0.3s;
}

.search-clear:hover {
  background: var(--border-color);
  color: var(--text-primary);
}

/* Search Dropdown */
.search-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--bg-card);
  border: 2px solid var(--border-color);
  border-radius: 16px;
  max-height: 400px;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
  z-index: 100;
  animation: slideDown 0.2s;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-result-item {
  padding: 14px 18px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background: var(--bg-hover);
}

.search-result-name {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.search-result-price {
  color: var(--primary-color);
  font-weight: 600;
  font-size: 0.95rem;
}

.search-result-info {
  flex: 1;
}

.search-result-meta {
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* Loading State */
.search-loading {
  padding: 20px;
  text-align: center;
  color: var(--text-secondary);
}

/* No Results */
.search-no-results {
  padding: 24px;
  text-align: center;
  color: var(--text-secondary);
}

/* Search Status */
.search-status {
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(16, 185, 129, 0.1);
  border-left: 3px solid var(--primary-color);
  border-radius: 8px;
}

.search-status-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .search-dropdown {
    max-height: 300px;
  }
}
```

**Approach:** Create separate CSS file for modularity, import in [menu.html](file:///c:/web_ordering/menu.html)

---

### 4. Integration Points

#### [MODIFY] [public/menu.html](file:///c:/web_ordering/public/menu.html)

**Changes needed:**

1. **Add CSS link** (after line 8):
```html
<link rel="stylesheet" href="css/search.css">
```

2. **Add search bar HTML** (after line 16, before category filter)

3. **Add script imports** (before line 91):
```html
<script src="js/levenshtein.js"></script>
<script src="js/search-bar.js"></script>
```

4. **Initialize search** (in DOMContentLoaded, after line 113):
```javascript
initializeSearch(currentProducts);
```

5. **Update on products reload** (in [loadProducts()](file:///c:/web_ordering/public/menu.html#116-144) after line 137):
```javascript
// After renderProducts(currentProducts);
if (window.updateSearchProducts) {
  window.updateSearchProducts(currentProducts);
}
```

---

## Features Specification

### Levenshtein Algorithm

**Threshold:** 40% of target string length

**Example:**
- "NASI GORENG" (11 chars) → max distance = 4
- "AYM BKAR" vs "Ayam Bakar" → distance = 2 ✅ (threshold = 4)
- "ES TEH" (6 chars) → max distance = 2 (but won't match "Es Teh Manis" due to 6 char difference)

**Handling:**
- Case-insensitive comparison
- Trim whitespace
- Sort by distance (ascending)
- Return top 5 results

---

### Debouncing

**Delay:** 280ms after last keystroke

**Bypass:** Enter key immediately triggers search

**Implementation:**
```javascript
clearTimeout(debounceTimer);
debounceTimer = setTimeout(() => {
  performSearch(query);
}, 280);

// Enter key bypass
if (event.key === 'Enter') {
  clearTimeout(debounceTimer);
  performSearch(query);
}
```

---

### Memory Caching

**Storage:** JavaScript object in RAM

**Lifecycle:** 
- Created on page load
- Cleared on page reload
- Cleared when products are reloaded

**Structure:**
```javascript
{
  "nasi goreng": [
    { product: {...}, distance: 0, similarity: 1 },
    // ...
  ],
  "ayam bakar": [ ... ]
}
```

---

### UI/UX Behavior

**Search Input:**
- Min 2 characters to trigger
- Show magnifying glass icon 🔍
- Show clear button (×) when input has text
- Placeholder: "Cari menu..."

**Dropdown:**
- Appears below search bar
- Max 5 suggestions
- Text only (no images)
- Show product name + price
- Hoverable items
- Click item → open product modal
- Click outside → close dropdown

**Enter Key:**
- If 1 exact match → open modal directly
- If multiple matches → keep dropdown open
- If no results → show "no results" message

**Responsive:**
- Same behavior on PC and mobile
- Touch-friendly on mobile (44px min tap target)
- Works with bottom navigation

---

## Verification Plan

### Unit Tests (Manual)

**Test Case 1: Exact Match**
```
Input: "nasi goreng"
Expected: "Nasi Goreng" appears first (distance = 0)
```

**Test Case 2: Typo - 1 char**
```
Input: "nasi goren" (missing 'g')
Expected: "Nasi Goreng" appears (distance = 1)
```

**Test Case 3: Typo - 2 chars**
```
Input: "ayam bkar" (missing 'a')
Expected: "Ayam Bakar" appears (distance = 1)
```

**Test Case 4: Typo - Multiple chars**
```
Input: "nsi grng" (missing 'a', 'o', 'e')
Expected: "Nasi Goreng" appears (distance = 3-4)
```

**Test Case 5: No Match**
```
Input: "pizza" (not in menu)
Expected: "Tidak ada hasil" message
```

**Test Case 6: Cache Test**
```
1. Search "nasi goreng" → measure time (e.g., 12ms)
2. Clear input
3. Search "nasi goreng" again → measure time (e.g., 0.2ms)
Expected: Second search significantly faster
```

**Test Case 7: Debounce Test**
```
Type "n-a-s-i-g-o-r-e-n-g" quickly
Expected: Only 1 search triggered after typing stops
```

**Test Case 8: Enter Key**
```
Type "nasi goreng" and press Enter immediately
Expected: Search triggered without waiting debounce delay
```

**Test Case 9: Responsive**
```
Test on mobile viewport (375px)
Expected: Search bar responsive, dropdown fits screen
```

**Test Case 10: UI Consistency**
```
Check colors, borders, shadows
Expected: Matches existing dark theme perfectly
```

---

### Performance Benchmarks

**Target Metrics:**

| Metric | Target | Measurement |
|--------|--------|-------------|
| First search (100 products) | < 20ms | `performance.now()` |
| Cached search | < 1ms | `performance.now()` |
| Debounce efficiency | 10x fewer calls | Console log count |
| Dropdown render time | < 50ms | `performance.now()` |
| Memory usage | < 5MB | Chrome DevTools |

---

## Implementation Order

1. ✅ Create `levenshtein.js` - Core algorithm
2. ✅ Create `search.css` - Styling
3. ✅ Create `search-bar.js` - UI logic
4. ✅ Update [menu.html](file:///c:/web_ordering/menu.html) - Integration
5. ✅ Test all cases
6. ✅ Performance optimization if needed

**Estimated Time:** 2-3 hours

---

## Accessibility Considerations

- [ ] `aria-label` for search input
- [ ] `role="combobox"` for autocomplete
- [ ] `aria-expanded` for dropdown state
- [ ] Keyboard navigation (Arrow keys to navigate suggestions)
- [ ] ESC key to close dropdown

---

## Browser Compatibility

**Supported:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Fallback:** If JavaScript disabled, search bar hidden (progressive enhancement)

---

## Future Enhancements (Out of Scope)

- Search history
- Voice search
- Advanced filters (price range, category)
- Fuzzy phonetic matching
- Server-side search for large datasets (>10,000 products)

---

**Ready for implementation!** All components designed to seamlessly integrate with existing dark theme and UI patterns.
