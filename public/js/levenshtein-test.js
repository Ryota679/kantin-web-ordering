/**
 * TEST FILE: Levenshtein Distance Algorithm
 * 
 * This file tests the Levenshtein implementation
 * Run in browser console or Node.js
 */

// Test data - simulated menu products
const sampleProducts = [
    { $id: '1', name: 'Nasi Goreng', price: 15000 },
    { $id: '2', name: 'Nasi Goreng Spesial', price: 20000 },
    { $id: '3', name: 'Nasi Uduk', price: 12000 },
    { $id: '4', name: 'Ayam Goreng', price: 18000 },
    { $id: '5', name: 'Ayam Bakar', price: 20000 },
    { $id: '6', name: 'Mie Goreng', price: 13000 },
    { $id: '7', name: 'Es Teh Manis', price: 5000 },
    { $id: '8', name: 'Es Teh Tawar', price: 3000 },
    { $id: '9', name: 'Es Jeruk', price: 7000 },
    { $id: '10', name: 'Kopi Susu', price: 8000 }
];

console.log('='.repeat(60));
console.log('LEVENSHTEIN DISTANCE ALGORITHM - TEST SUITE');
console.log('='.repeat(60));

// Test 1: Exact Match
console.log('\n📌 TEST 1: Exact Match');
console.log('-'.repeat(60));
const test1 = fuzzySearchLevenshtein('nasi goreng', sampleProducts);
console.log('Query: "nasi goreng"');
console.log('Results:', test1.length);
test1.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.product.name} - Distance: ${r.distance}, Similarity: ${(r.similarity * 100).toFixed(1)}%`);
});
console.log('✅ Expected: "Nasi Goreng" with distance 0');

// Test 2: Typo - 1 character missing
console.log('\n📌 TEST 2: Typo - Missing 1 Character');
console.log('-'.repeat(60));
const test2 = fuzzySearchLevenshtein('nasi goren', sampleProducts);
console.log('Query: "nasi goren" (missing "g")');
console.log('Results:', test2.length);
test2.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.product.name} - Distance: ${r.distance}, Similarity: ${(r.similarity * 100).toFixed(1)}%`);
});
console.log('✅ Expected: "Nasi Goreng" with distance 1');

// Test 3: Typo - 2 characters
console.log('\n📌 TEST 3: Typo - 2 Characters');
console.log('-'.repeat(60));
const test3 = fuzzySearchLevenshtein('ayam bkar', sampleProducts);
console.log('Query: "ayam bkar" (missing "a")');
console.log('Results:', test3.length);
test3.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.product.name} - Distance: ${r.distance}, Similarity: ${(r.similarity * 100).toFixed(1)}%`);
});
console.log('✅ Expected: "Ayam Bakar" with low distance');

// Test 4: Severe typo
console.log('\n📌 TEST 4: Severe Typo - Multiple Characters');
console.log('-'.repeat(60));
const test4 = fuzzySearchLevenshtein('nsi grng', sampleProducts);
console.log('Query: "nsi grng" (missing "a", "o", "e")');
console.log('Results:', test4.length);
test4.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.product.name} - Distance: ${r.distance}, Similarity: ${(r.similarity * 100).toFixed(1)}%`);
});
console.log('✅ Expected: "Nasi Goreng" should still match (40% threshold)');

// Test 5: No match
console.log('\n📌 TEST 5: No Match');
console.log('-'.repeat(60));
const test5 = fuzzySearchLevenshtein('pizza', sampleProducts);
console.log('Query: "pizza" (not in menu)');
console.log('Results:', test5.length);
test5.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.product.name} - Distance: ${r.distance}, Similarity: ${(r.similarity * 100).toFixed(1)}%`);
});
console.log('✅ Expected: 0 results or very low similarity');

// Test 6: Partial search
console.log('\n📌 TEST 6: Partial Search');
console.log('-'.repeat(60));
const test6 = fuzzySearchLevenshtein('es teh', sampleProducts);
console.log('Query: "es teh"');
console.log('Results:', test6.length);
test6.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.product.name} - Distance: ${r.distance}, Similarity: ${(r.similarity * 100).toFixed(1)}%`);
});
console.log('ℹ️  Note: May not match "Es Teh Manis" due to length difference');

// Test 7: Case insensitivity
console.log('\n📌 TEST 7: Case Insensitivity');
console.log('-'.repeat(60));
const test7a = fuzzySearchLevenshtein('AYAM GORENG', sampleProducts);
const test7b = fuzzySearchLevenshtein('ayam goreng', sampleProducts);
const test7c = fuzzySearchLevenshtein('AyAm GoReNg', sampleProducts);
console.log('Query variations: "AYAM GORENG", "ayam goreng", "AyAm GoReNg"');
console.log('Results should be identical:');
console.log(`  Uppercase: ${test7a.length} results, distance: ${test7a[0]?.distance}`);
console.log(`  Lowercase: ${test7b.length} results, distance: ${test7b[0]?.distance}`);
console.log(`  MixedCase: ${test7c.length} results, distance: ${test7c[0]?.distance}`);
console.log('✅ Expected: All should return same results');

// Test 8: Performance benchmark
console.log('\n📌 TEST 8: Performance Benchmark');
console.log('-'.repeat(60));
const iterations = 1000;
const startTime = performance.now();
for (let i = 0; i < iterations; i++) {
    fuzzySearchLevenshtein('nasi goreng', sampleProducts);
}
const endTime = performance.now();
const avgTime = (endTime - startTime) / iterations;
console.log(`Iterations: ${iterations}`);
console.log(`Total time: ${(endTime - startTime).toFixed(2)}ms`);
console.log(`Average time per search: ${avgTime.toFixed(3)}ms`);
console.log('✅ Expected: < 1ms per search for 10 products');

// Test 9: Visualize DP Matrix (for thesis documentation)
console.log('\n📌 TEST 9: DP Matrix Visualization (Thesis)');
console.log('-'.repeat(60));
printLevenshteinMatrix('AYM', 'AYAM');
printLevenshteinMatrix('NASI GOREN', 'NASI GORENG');

// Test 10: Threshold testing
console.log('\n📌 TEST 10: Threshold Testing');
console.log('-'.repeat(60));
const testWord = 'goreng';
console.log(`Testing word: "${testWord}"`);
console.log('\nThreshold 30%:');
const test10a = fuzzySearchLevenshtein('goreng', sampleProducts, 0.30);
console.log(`  Results: ${test10a.length}`);
test10a.forEach(r => console.log(`    - ${r.product.name}`));

console.log('\nThreshold 40% (default):');
const test10b = fuzzySearchLevenshtein('goreng', sampleProducts, 0.40);
console.log(`  Results: ${test10b.length}`);
test10b.forEach(r => console.log(`    - ${r.product.name}`));

console.log('\nThreshold 50%:');
const test10c = fuzzySearchLevenshtein('goreng', sampleProducts, 0.50);
console.log(`  Results: ${test10c.length}`);
test10c.forEach(r => console.log(`    - ${r.product.name}`));

console.log('\n✅ Higher threshold = more lenient matching');

console.log('\n' + '='.repeat(60));
console.log('ALL TESTS COMPLETED ✅');
console.log('='.repeat(60));
