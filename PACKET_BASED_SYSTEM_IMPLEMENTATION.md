# Packet-Based System Implementation

## Overview

The store application has been updated to use a **packet-based calculation system** where all pricing and quantity calculations are based on packets rather than individual pieces. This system supports fractional packets (0.5, 0.25, etc.) to allow for more flexible ordering.

## Key Changes

### 1. **Primary Calculation Unit: Packets**
- All pricing is now based on **price per packet**
- Orders are placed in **packets** (can be fractional)
- Stock is managed in **packets**

### 2. **Fractional Packet Support**
- Users can order fractional packets (0.5, 0.25, 0.75, etc.)
- System calculates total pieces automatically: `packets × VPE = total pieces`
- Supports percentage-based ordering (half packet, quarter packet, etc.)

### 3. **German Business Terminology**
- **VPE** (Verpackungseinheit): Units per package
- **Menge**: Number of packages (can be fractional)
- **Inhalt**: Total pieces (calculated as Menge × VPE)
- **E-Preis**: Price per packet
- **G-Preis**: Total price (E-Preis × Menge)

## Database Schema Changes

### Products Table
```sql
-- Updated fields
package FLOAT NOT NULL DEFAULT 0  -- Number of packets (can be fractional)
quantity FLOAT NOT NULL DEFAULT 0 -- Total pieces (calculated)
price FLOAT NOT NULL              -- Price per packet
```

### Order Items Table
```sql
-- Updated fields
packages FLOAT NOT NULL DEFAULT 0 -- Number of packets (can be fractional)
quantity FLOAT NOT NULL           -- Total pieces (calculated)
originalPrice FLOAT NOT NULL      -- Price per packet
adjustedPrice FLOAT NULL          -- Adjusted price per packet
```

## Service Layer Updates

### 1. **Order Service**
- `createOrder()`: Now requires `packages` field instead of `quantity`
- `addItemToOrder()`: Updated to use packet-based calculations
- Stock reduction: Based on packets, not pieces

### 2. **Angebot Service**
- `createAngebotFromOrder()`: Uses packet-based pricing
- `updateAngebotItems()`: Supports fractional packet updates

### 3. **Invoice Service**
- `create()`: Generates invoices with packet-based calculations
- Template data includes packet quantities and pricing

### 4. **Credit Note Service**
- `create()`: Handles returns in packet-based calculations
- Converts piece returns to packet equivalents

## API Changes

### Order Creation
```typescript
// Before
{
  items: [{
    productId: number,
    quantity: number,        // Total pieces
    packages?: number,
    isPackage?: boolean
  }]
}

// After
{
  items: [{
    productId: number,
    packages: number         // Required: Number of packets (can be fractional)
  }]
}
```

### Order Item Response
```typescript
{
  id: number,
  productId: number,
  packages: number,         // Number of packets (can be fractional)
  quantity: number,         // Total pieces (calculated)
  originalPrice: number,    // Price per packet
  adjustedPrice: number,    // Adjusted price per packet
  taxRate: number,
  taxAmount: number,
  unitPerPackageSnapshot: number
}
```

## Calculation Examples

### Example 1: Whole Packets
- Product: 6 pieces per packet, €10 per packet
- Order: 3 packets
- Calculation: 3 × €10 = €30
- Total pieces: 3 × 6 = 18 pieces

### Example 2: Fractional Packets
- Product: 6 pieces per packet, €10 per packet
- Order: 2.5 packets
- Calculation: 2.5 × €10 = €25
- Total pieces: 2.5 × 6 = 15 pieces

### Example 3: Quarter Packet
- Product: 8 pieces per packet, €12 per packet
- Order: 0.25 packets
- Calculation: 0.25 × €12 = €3
- Total pieces: 0.25 × 8 = 2 pieces

## Migration Guide

### 1. **Run Database Migration**
```bash
npm run migrate
```

### 2. **Update Frontend Applications**
- Mobile app: Update order creation to send `packages` instead of `quantity`
- Dashboard: Update UI to display packet quantities
- Forms: Allow fractional packet input

### 3. **Update Existing Data**
- Existing orders will maintain their current structure
- New orders will use packet-based calculations
- Consider data migration for consistency

## Benefits

### 1. **Flexibility**
- Support for fractional orders (half packets, quarter packets)
- More precise inventory management
- Better customer experience

### 2. **Consistency**
- All calculations based on packets
- Unified pricing model across all entities
- Simplified business logic

### 3. **German Business Compliance**
- Proper VPE/Menge/Inhalt terminology
- Standard German business calculations
- Professional invoice formatting

## Testing

### Test Cases
1. **Whole Packet Orders**: Verify 1, 2, 3+ packet orders
2. **Fractional Packet Orders**: Test 0.5, 0.25, 0.75 packet orders
3. **Mixed Orders**: Orders with both whole and fractional packets
4. **Stock Management**: Verify packet-based stock reduction
5. **Invoice Generation**: Check packet-based invoice calculations
6. **Credit Notes**: Test packet-based return calculations

### Sample Test Data
```javascript
// Test fractional packet order
const testOrder = {
  userId: 1,
  storeId: 1,
  items: [{
    productId: 1,
    packages: 2.5  // 2.5 packets
  }]
};
```

## Rollback Plan

If issues arise, the system can be rolled back using:
```bash
npm run migrate:rollback
```

This will revert the database schema changes and restore the previous piece-based system.

## Future Enhancements

1. **Bulk Packet Orders**: Support for ordering multiple products in packet quantities
2. **Packet Discounts**: Volume discounts based on packet quantities
3. **Advanced Fractional Support**: Support for more precise fractional packets (0.125, etc.)
4. **Packet Analytics**: Reporting based on packet sales and inventory

## Support

For questions or issues with the packet-based system:
1. Check the calculation examples above
2. Verify database migration completed successfully
3. Test with simple fractional packet orders first
4. Review the German business utility functions for calculation logic
