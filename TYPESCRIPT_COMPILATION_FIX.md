# TypeScript Compilation Fix

## Error
```
src/services/creditNote.service.ts(44,116): error TS2554: Expected 2 arguments, but got 3.
```

## Root Cause
The `generateCreditNotePdf` function expects 2 arguments:
1. `order: Order`
2. `templateData: any`

But in the `regeneratePdf` method, it was being called with 3 arguments:
```typescript
// ❌ WRONG: Passing 3 arguments
const result = await generateCreditNotePdf(
  (creditNote as any).order, 
  (creditNote as any).order.items || [], 
  (creditNote as any).order.returns || []
);
```

## Fix Applied
Updated the `regeneratePdf` method to properly construct the `templateData` object with the same logic as the `create` method:

```typescript
// ✅ CORRECT: Passing 2 arguments with proper templateData
const order = (creditNote as any).order;
const items = order.items || [];
const returns = order.returns || [];

// Calculate refund and tax breakdown (same logic as create method)
let refundAmount = 0;
let totalNet = 0;
let vat7 = 0;
let vat19 = 0;

returns.forEach((ret: any) => {
  const relatedItem = items.find((i: any) => i.id === ret.orderItemId || i.productId === ret.orderItemId);
  const price = relatedItem ? relatedItem.adjustedPrice ?? relatedItem.originalPrice : 0;
  const taxRate = relatedItem?.taxRate || 0;
  const itemTotal = price * ret.quantity;
  refundAmount += itemTotal;
  totalNet += itemTotal / (1 + taxRate);
  
  if (Math.abs(taxRate - 0.07) < 0.01) {
    vat7 += itemTotal - (itemTotal / 1.07);
  } else if (Math.abs(taxRate - 0.19) < 0.01) {
    vat19 += itemTotal - (itemTotal / 1.19);
  }
});

const totalGross = totalNet + vat7 + vat19;

const templateData = {
  storeName: order.store?.name,
  userName: order.user?.name,
  storeAddress: order.store?.address,
  storeCity: order.store?.city,
  storePostalCode: order.store?.postalCode,
  creditNumber: creditNote.number,
  orderId: order.id,
  creditDate: creditNote.date.toLocaleDateString('de-DE'),
  kundenNr: order.userId,
  items: returns.map((ret: any) => {
    const relatedItem = items.find((i: any) => i.id === ret.orderItemId || i.productId === ret.orderItemId);
    const price = relatedItem ? relatedItem.adjustedPrice ?? relatedItem.originalPrice : 0;
    const taxRate = relatedItem?.taxRate || 0;
    const ratePercent = taxRate < 1 ? taxRate * 100 : taxRate;
    
    return {
      id: ret.orderItemId,
      name: relatedItem?.orderProduct?.name || ret.orderItemId,
      quantity: ret.quantity,
      price: price,
      total: price * ret.quantity,
      taxRate: ratePercent,
      taxAmount: (price * ret.quantity) - ((price * ret.quantity) / (1 + taxRate))
    };
  }),
  totalNet,
  vat7,
  vat19,
  totalGross,
  isLastPage: true // Always show bank details for credit notes
};

const result = await generateCreditNotePdf(order, templateData);
```

## What This Fix Does
1. **Properly constructs templateData:** Uses the same calculation logic as the `create` method
2. **Maintains consistency:** Ensures regenerated PDFs have the same data structure as newly created ones
3. **Fixes TypeScript error:** Calls the function with the correct number of arguments
4. **Preserves functionality:** The regenerated PDF will contain the same information as the original

## Files Modified
- `store-app/src/services/creditNote.service.ts` - Fixed `regeneratePdf` method

## Expected Result
- ✅ TypeScript compilation should now succeed
- ✅ Credit note regeneration should work correctly
- ✅ Regenerated PDFs will have the same data as original PDFs

The deployment should now proceed successfully without TypeScript compilation errors.
