/**
 * Database Migration Script: Fix Product Quantity Consistency
 * 
 * This script fixes any existing products where quantity != package * numberperpackage
 * Run this script once to fix data consistency issues.
 */

import sequelize from '../config/database';
import Product from '../models/product.model';

async function fixProductQuantityConsistency() {
  console.log('🔧 Starting product quantity consistency fix...');
  
  try {
    // Get all products
    const products = await Product.findAll();
    console.log(`📦 Found ${products.length} products to check`);
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      try {
        const expectedQuantity = product.package * product.numberperpackage;
        const currentQuantity = product.quantity;
        
        // Check if quantity is inconsistent
        if (Math.abs(currentQuantity - expectedQuantity) > 0.01) {
          console.log(`🔧 Fixing product ${product.id} (${product.name}):`);
          console.log(`   Current quantity: ${currentQuantity}`);
          console.log(`   Expected quantity: ${expectedQuantity} (${product.package} packages × ${product.numberperpackage} VPE)`);
          
          // Update the quantity
          await product.update({ quantity: expectedQuantity });
          fixedCount++;
          
          console.log(`   ✅ Fixed to: ${expectedQuantity}`);
        }
      } catch (error) {
        console.error(`❌ Error fixing product ${product.id}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Products fixed: ${fixedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total products: ${products.length}`);
    
    if (fixedCount > 0) {
      console.log('\n🎉 Product quantity consistency fix completed successfully!');
    } else {
      console.log('\n✨ All products already have consistent quantities!');
    }
    
  } catch (error) {
    console.error('❌ Error during product quantity consistency fix:', error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  fixProductQuantityConsistency()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export default fixProductQuantityConsistency;
