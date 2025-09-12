# German Business Terminology Implementation

## Overview
This document outlines the implementation of German business terminology for package management in the store application. The implementation adds support for proper German business calculations and terminology without requiring backend database changes.

## German Business Terms Implemented

### Core Terminology
- **VPE** (Verpackungseinheit) = Units per package (`numberperpackage`)
- **Menge** = Number of packages (`package`)
- **Inhalt** = Total pieces (VPE × Menge = `quantity`)
- **E-Preis** = Price per piece (`price`)
- **G-Preis** = Total price (E-Preis × Inhalt)
- **Einheit** = Unit type ('Paket' or 'Stück')

### Business Logic
- **Inhalt = Menge × VPE** (when dealing with packages)
- **G-Preis = E-Preis × Inhalt** (total price calculation)
- **Einheit = 'Paket'** if packages > 0, otherwise **'Stück'**

## Files Modified

### 1. New Utility File: `src/utils/germanBusiness.util.ts`
- **Purpose**: Centralized German business calculations and formatting
- **Key Functions**:
  - `calculateGermanBusinessFields()` - Convert product data to German terminology
  - `calculateGermanBusinessFieldsFromOrderItem()` - Convert order item data
  - `calculateInhalt()`, `calculateGPreis()`, `calculateMenge()` - Individual calculations
  - `formatPrice()`, `formatNumber()` - German number formatting
  - `validateGermanBusinessData()` - Data validation
  - `addGermanFieldsToProduct()`, `addGermanFieldsToOrderItem()` - API response helpers

### 2. Product Service: `src/services/product.service.ts`
- **Changes**: All product API responses now include German terminology fields
- **Methods Updated**:
  - `getAllProducts()` - Dashboard product list with German fields
  - `getProductById()` - Individual product with German fields
  - `getProductsByCategoryId()` - Category products with German fields

### 3. Order Service: `src/services/order.service.ts`
- **Changes**: Order items now include German terminology fields
- **Methods Updated**:
  - `getAllOrders()` - Order list with German fields in items
  - `getOrderDetails()` - Detailed order view with German fields

### 4. Angebot Service: `src/services/angebot.service.ts`
- **Changes**: Angebot items now include German terminology fields
- **Methods Updated**:
  - `getAngebotById()` - Angebot details with German fields in items

### 5. Invoice Service: `src/services/invoice.service.ts`
- **Changes**: Invoice items now include German terminology fields
- **Methods Updated**:
  - `create()` - Invoice creation with German fields in template data

## API Response Format

### Product Response Example
```json
{
  "id": 1,
  "name": "Product Name",
  "price": 2.50,
  "quantity": 100,
  "package": 10,
  "numberperpackage": 10,
  "vpe": 10,           // NEW: Units per package
  "menge": 10,         // NEW: Number of packages
  "inhalt": 100,       // NEW: Total pieces
  "ePreis": 2.50,      // NEW: Price per piece
  "gPreis": 250.00,    // NEW: Total price
  "einheit": "Paket"   // NEW: Unit type
}
```

### Order Item Response Example
```json
{
  "id": 1,
  "productId": 1,
  "quantity": 20,
  "packages": 2,
  "originalPrice": 2.50,
  "adjustedPrice": 2.30,
  "vpe": 10,           // NEW: Units per package
  "menge": 2,          // NEW: Number of packages
  "inhalt": 20,        // NEW: Total pieces
  "ePreis": 2.30,      // NEW: Price per piece (adjusted)
  "gPreis": 46.00,     // NEW: Total price
  "einheit": "Paket"   // NEW: Unit type
}
```

## Frontend Integration

### Dashboard Product List
The product list now includes these columns:
- **VPE** - Units per package
- **Menge** - Number of packages in stock
- **Inhalt** - Total pieces available
- **E-Preis** - Price per piece
- **G-Preis** - Total value (E-Preis × Inhalt)
- **Einheit** - Unit type (Paket/Stück)

### Order Creation Form
When creating orders, users can:
1. Select **Einheit** (Paket or Stück)
2. Enter **Menge** (if Paket) or **Inhalt** (if Stück)
3. See live calculations for:
   - **Inhalt** = Menge × VPE (if Paket)
   - **G-Preis** = E-Preis × Inhalt

### Angebot & Invoice Display
Both Angebots and Invoices now display:
- **VPE**, **Menge**, **Inhalt**, **E-Preis**, **G-Preis**, **Einheit** for each line item
- Proper German formatting for prices and numbers

## Validation & Error Handling

The utility functions include validation to ensure:
- All numeric values are non-negative
- Calculation consistency (Inhalt = Menge × VPE)
- Price calculation accuracy (G-Preis = E-Preis × Inhalt)
- Proper unit type determination

## Benefits

1. **No Database Changes**: All changes are in the application layer
2. **Consistent Calculations**: Centralized utility functions ensure accuracy
3. **German Business Compliance**: Proper terminology and calculations
4. **Backward Compatibility**: Existing functionality remains unchanged
5. **Easy Frontend Integration**: All required fields are provided in API responses

## Usage Examples

### Frontend Product Display
```typescript
// Product data from API already includes German fields
const product = {
  vpe: 10,
  menge: 5,
  inhalt: 50,
  ePreis: 2.50,
  gPreis: 125.00,
  einheit: 'Paket'
};

// Display in table
<TableRow>
  <TableCell>{product.vpe}</TableCell>
  <TableCell>{product.menge}</TableCell>
  <TableCell>{product.inhalt}</TableCell>
  <TableCell>{formatPrice(product.ePreis)}</TableCell>
  <TableCell>{formatPrice(product.gPreis)}</TableCell>
  <TableCell>{product.einheit}</TableCell>
</TableRow>
```

### Order Creation Logic
```typescript
// When user selects unit type and enters quantity
const calculateOrderLine = (einheit: 'Paket' | 'Stück', menge: number, vpe: number, ePreis: number) => {
  const inhalt = einheit === 'Paket' ? menge * vpe : menge;
  const gPreis = ePreis * inhalt;
  
  return {
    quantity: inhalt,
    packages: einheit === 'Paket' ? menge : 0,
    isPackage: einheit === 'Paket',
    // ... other fields
  };
};
```

This implementation provides a complete German business terminology system that integrates seamlessly with the existing codebase while maintaining all current functionality.
