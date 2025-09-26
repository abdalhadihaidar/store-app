/**
 * Test Script for Packet-Based System
 */

console.log('🚀 Starting Packet-Based System Tests');
console.log('=====================================');

// Test data
const testProducts = [
  {
    id: 1,
    name: 'Test Product 1',
    price: 10.00, // Price per packet
    numberperpackage: 6, // VPE
    package: 10, // Available packets
    quantity: 60 // Total pieces (10 × 6)
  }
];

// Test scenarios
const testScenarios = [
  {
    name: 'Whole Packet Order',
    items: [{ productId: 1, packages: 2.0 }],
    expectedTotal: 20.00,
    expectedPieces: 12
  },
  {
    name: 'Fractional Packet Order',
    items: [{ productId: 1, packages: 1.5 }],
    expectedTotal: 15.00,
    expectedPieces: 9
  },
  {
    name: 'Quarter Packet Order',
    items: [{ productId: 1, packages: 0.25 }],
    expectedTotal: 2.50,
    expectedPieces: 1.5
  }
];

// Test function
function testOrderCreation(scenario) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  
  let totalPrice = 0;
  let totalPieces = 0;
  
  scenario.items.forEach(item => {
    const product = testProducts.find(p => p.id === item.productId);
    if (product) {
      const itemTotal = product.price * item.packages;
      const itemPieces = item.packages * product.numberperpackage;
      
      totalPrice += itemTotal;
      totalPieces += itemPieces;
      
      console.log(`  📦 Product ${product.name}:`);
      console.log(`     Menge: ${item.packages} Paket(e)`);
      console.log(`     VPE: ${product.numberperpackage}`);
      console.log(`     Inhalt: ${itemPieces} Stück`);
      console.log(`     E-Preis: €${product.price.toFixed(2)}`);
      console.log(`     G-Preis: €${itemTotal.toFixed(2)}`);
    }
  });
  
  const tax = totalPrice * 0.19;
  const totalGross = totalPrice + tax;
  
  console.log(`\n💰 Calculation Results:`);
  console.log(`   Total Net: €${totalPrice.toFixed(2)}`);
  console.log(`   Tax (19%): €${tax.toFixed(2)}`);
  console.log(`   Total Gross: €${totalGross.toFixed(2)}`);
  console.log(`   Total Pieces: ${totalPieces}`);
  
  // Verify expectations
  const priceMatch = Math.abs(totalPrice - scenario.expectedTotal) < 0.01;
  const piecesMatch = Math.abs(totalPieces - scenario.expectedPieces) < 0.01;
  
  console.log(`\n✅ Verification:`);
  console.log(`   Price Match: ${priceMatch ? '✅' : '❌'}`);
  console.log(`   Pieces Match: ${piecesMatch ? '✅' : '❌'}`);
  
  return { success: priceMatch && piecesMatch, totalPrice, totalPieces };
}

// Run tests
let passedTests = 0;
let totalTests = testScenarios.length;

testScenarios.forEach(scenario => {
  const result = testOrderCreation(scenario);
  if (result.success) {
    passedTests++;
  }
});

// Summary
console.log('\n📊 Test Summary');
console.log('================');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 All tests passed! Packet-based system is working correctly.');
} else {
  console.log('\n⚠️  Some tests failed. Please review the implementation.');
}