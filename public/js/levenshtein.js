/**
 * LEVENSHTEIN DISTANCE ALGORITHM
 * 
 * Implementation for Kantin Web Ordering System
 * Fuzzy search algorithm to handle typos in menu search
 * 
 * Thesis: Penerapan Algoritma Levenshtein Distance untuk Pencarian Menu
 * 
 * Algorithm Overview:
 * - Calculates minimum edit distance between two strings
 * - Operations: Insertion, Deletion, Substitution
 * - Time Complexity: O(m × n) where m, n are string lengths
 * - Space Complexity: O(m × n) for DP matrix
 */

/**
 * Calculate Levenshtein Distance between two strings
 * 
 * The Levenshtein distance is a measure of similarity between two strings.
 * It counts the minimum number of single-character edits (insertions, 
 * deletions, or substitutions) required to change one string into another.
 * 
 * @param {string} source - Source string (user input)
 * @param {string} target - Target string (product name from database)
 * @returns {number} - Levenshtein distance (0 = identical)
 * 
 * @example
 * levenshteinDistance("AYAM", "AYAM") // 0 - identical
 * levenshteinDistance("AYM", "AYAM")  // 1 - one insertion
 * levenshteinDistance("AYAM BAKAR", "AYAM BKAR") // 1 - one insertion
 * levenshteinDistance("NASI GORENG", "NASI GOREN") // 1 - one insertion
 */
function levenshteinDistance(source, target) {
    const m = source.length;
    const n = target.length;

    // Edge cases
    if (m === 0) return n; // If source empty, need n insertions
    if (n === 0) return m; // If target empty, need m deletions

    // Create DP (Dynamic Programming) matrix
    // dp[i][j] = distance between source[0..i-1] and target[0..j-1]
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    // Initialize first row: converting empty string to target[0..j-1]
    for (let j = 0; j <= n; j++) {
        dp[0][j] = j;
    }

    // Initialize first column: converting source[0..i-1] to empty string
    for (let i = 0; i <= m; i++) {
        dp[i][0] = i;
    }

    // Fill the DP matrix
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            // If characters match, no operation needed
            if (source[i - 1] === target[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                // Take minimum of three operations:
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,      // Deletion: remove source[i-1]
                    dp[i][j - 1] + 1,      // Insertion: add target[j-1]
                    dp[i - 1][j - 1] + 1   // Substitution: replace source[i-1] with target[j-1]
                );
            }
        }
    }

    // Return final distance
    return dp[m][n];
}


/**
 * Calculate similarity score between two strings
 * 
 * @param {string} source - Source string
 * @param {string} target - Target string
 * @returns {number} - Similarity score between 0 and 1 (1 = identical)
 * 
 * @example
 * calculateSimilarity("NASI GORENG", "NASI GORENG") // 1.0
 * calculateSimilarity("NASI GORENG", "NASI GOREN")  // 0.91
 */
function calculateSimilarity(source, target) {
    const distance = levenshteinDistance(source, target);
    const maxLength = Math.max(source.length, target.length);

    if (maxLength === 0) return 1; // Both empty strings

    return 1 - (distance / maxLength);
}


/**
 * Fuzzy search products using Levenshtein Distance algorithm
 * 
 * This function implements smart search with typo tolerance:
 * 1. Normalizes input (lowercase, trim)
 * 2. Calculates Levenshtein distance for each product
 * 3. Filters by threshold (40% of product name length)
 * 4. Sorts by relevance (distance ascending)
 * 5. Returns top 5 matches
 * 
 * @param {string} query - User search query
 * @param {Array} products - Array of product objects from database
 * @param {number} thresholdPercent - Tolerance threshold (default 0.40 = 40%)
 * @returns {Array} - Array of matching products with metadata
 * 
 * @example
 * const products = [
 *   { $id: '1', name: 'Nasi Goreng', price: 15000 },
 *   { $id: '2', name: 'Ayam Bakar', price: 20000 }
 * ];
 * 
 * fuzzySearchLevenshtein('nasi goren', products);
 * // Returns: [{ product: {...}, distance: 1, similarity: 0.91, ... }]
 */
function fuzzySearchLevenshtein(query, products, thresholdPercent = 0.40) {
    // Normalize query: lowercase and trim whitespace
    const normalizedQuery = query.toLowerCase().trim();

    // Return empty if query too short
    if (normalizedQuery.length < 1) {
        return [];
    }

    // Calculate distance for each product
    const results = products.map(product => {
        // Normalize product name
        const normalizedName = product.name.toLowerCase().trim();

        // Calculate Levenshtein distance
        const distance = levenshteinDistance(normalizedQuery, normalizedName);

        // Calculate threshold based on product name length
        // Example: "NASI GORENG" (11 chars) × 0.40 = 4.4 → floor = 4
        const maxDistance = Math.floor(normalizedName.length * thresholdPercent);

        // Calculate similarity score (0-1)
        const similarity = calculateSimilarity(normalizedQuery, normalizedName);

        // Determine if it's a match
        const isMatch = distance <= maxDistance;

        return {
            product: product,           // Original product object
            distance: distance,         // Levenshtein distance
            maxDistance: maxDistance,   // Maximum allowed distance
            similarity: similarity,     // Similarity score (0-1)
            isMatch: isMatch,          // Whether it passes threshold
            normalizedName: normalizedName // For debugging
        };
    });

    // Filter only matching products
    const matches = results.filter(result => result.isMatch);

    // Sort by distance (ascending) - closest matches first
    // Secondary sort by similarity (descending) for ties
    matches.sort((a, b) => {
        if (a.distance !== b.distance) {
            return a.distance - b.distance; // Lower distance = better match
        }
        return b.similarity - a.similarity; // Higher similarity = better match
    });

    // Return top 5 matches
    return matches.slice(0, 5);
}


/**
 * Debug function to visualize Levenshtein Distance calculation
 * Useful for thesis documentation and understanding the algorithm
 * 
 * @param {string} source - Source string
 * @param {string} target - Target string
 * @returns {Object} - Debug information with DP matrix
 */
function debugLevenshtein(source, target) {
    const m = source.length;
    const n = target.length;

    if (m === 0 || n === 0) {
        return {
            source,
            target,
            distance: Math.max(m, n),
            matrix: null
        };
    }

    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 0; i <= m; i++) dp[i][0] = i;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (source[i - 1] === target[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + 1
                );
            }
        }
    }

    return {
        source: source,
        target: target,
        distance: dp[m][n],
        similarity: calculateSimilarity(source, target),
        matrix: dp,
        sourceLength: m,
        targetLength: n
    };
}


/**
 * Print Levenshtein matrix to console (for debugging/thesis)
 * 
 * @param {string} source - Source string
 * @param {string} target - Target string
 */
function printLevenshteinMatrix(source, target) {
    const debug = debugLevenshtein(source, target);

    if (!debug.matrix) {
        console.log(`One of the strings is empty. Distance: ${debug.distance}`);
        return;
    }

    console.log(`\n=== Levenshtein Distance Calculation ===`);
    console.log(`Source: "${source}"`);
    console.log(`Target: "${target}"`);
    console.log(`Distance: ${debug.distance}`);
    console.log(`Similarity: ${(debug.similarity * 100).toFixed(1)}%\n`);

    // Print matrix header
    console.log('DP Matrix:');
    let header = '    ε  ';
    for (let j = 0; j < target.length; j++) {
        header += ` ${target[j]}  `;
    }
    console.log(header);

    // Print matrix rows
    for (let i = 0; i <= source.length; i++) {
        let row = i === 0 ? 'ε ' : `${source[i - 1]} `;
        for (let j = 0; j <= target.length; j++) {
            row += ` ${debug.matrix[i][j].toString().padStart(2)} `;
        }
        console.log(row);
    }
    console.log('');
}


// Export functions for use in other scripts
// (Note: In browser environment without module system, these are globally available)
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        levenshteinDistance,
        calculateSimilarity,
        fuzzySearchLevenshtein,
        debugLevenshtein,
        printLevenshteinMatrix
    };
}
