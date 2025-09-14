# PDF Regeneration Fix

## Problem
The error `"PDF file does not exist on server and could not be regenerated"` was occurring because the `regeneratePdf` method was not properly constructing the template data needed for PDF generation.

## Root Cause
The `regeneratePdf` method was calling `generateInvoicePdf` with incomplete data:

```typescript
// ❌ WRONG: Missing template data
const result = await generateInvoicePdf((invoice as any).order, (invoice as any).order.items || []);
```

The `generateInvoicePdf` function expects:
1. `order: Order` - The order object
2. `templateData: any` - Complete template data with calculated fields

But the `regeneratePdf` method was only passing the order and items, missing crucial template data like:
- Store information (name, address, city, postal code)
- User information (name, customer number)
- Invoice details (number, date)
- Calculated totals (totalNet, vat7, vat19, totalGross)
- Item details with proper formatting

## Fix Applied

Updated the `regeneratePdf` method to properly construct the template data with the same logic as the `create` method:

```typescript
// ✅ CORRECT: Proper template data construction
const order = (invoice as any).order;
const items = order.items || [];

// Calculate totals (same logic as create method)
const vat7Sum = items.reduce((acc: number, i: any) => {
  const rp = i.taxRate < 1 ? i.taxRate * 100 : i.taxRate;
  return Math.abs(rp - 7) < 0.01 ? acc + i.taxAmount : acc;
}, 0);
const vat19Sum = items.reduce((acc: number, i: any) => {
  const rp = i.taxRate < 1 ? i.taxRate * 100 : i.taxRate;
  return Math.abs(rp - 19) < 0.01 ? acc + i.taxAmount : acc;
}, 0);

const templateData = {
  storeName: order.store?.name,
  userName: order.user?.name,
  storeAddress: order.store?.address,
  storeCity: order.store?.city,
  storePostalCode: order.store?.postalCode,
  invoiceNumber: invoice.number,
  orderId: order.id,
  invoiceDate: invoice.date.toLocaleDateString('de-DE'),
  kundenNr: order.userId,
  items: items.map((i: any) => {
    const ratePercent = i.taxRate < 1 ? i.taxRate * 100 : i.taxRate;
    const baseItem = {
      id: i.productId,
      name: (i as any).product?.name || i.productId,
      packages: i.packages,
      numberPerPackage: (i as any).product?.numberperpackage || 0,
      quantity: i.quantity,
      price: i.adjustedPrice ?? i.originalPrice,
      adjustedPrice: i.adjustedPrice,
      total: (i.adjustedPrice ?? i.originalPrice) * i.quantity,
      tax7: Math.abs(ratePercent - 7) < 0.01 ? i.taxAmount : 0,
      tax19: Math.abs(ratePercent - 19) < 0.01 ? i.taxAmount : 0,
    };
    
    // Add German business terminology
    return addGermanFieldsToOrderItem(baseItem);
  }),
  totalNet: invoice.totalNet,
  vat7: vat7Sum,
  vat19: vat19Sum,
  totalGross: invoice.totalGross,
  isLastPage: true // Always show bank details for invoices
};

const result = await generateInvoicePdf(order, templateData);
```

## What This Fix Ensures

### **Complete Template Data:**
- ✅ **Store information** - Name, address, city, postal code
- ✅ **User information** - Name and customer number
- ✅ **Invoice details** - Number and formatted date
- ✅ **Calculated totals** - Net, VAT 7%, VAT 19%, Gross totals
- ✅ **Item formatting** - Proper mapping with German business terminology
- ✅ **PDF layout** - Bank details in footer (isLastPage: true)

### **Consistency with Creation:**
- ✅ **Same calculation logic** as the `create` method
- ✅ **Same template data structure** as original creation
- ✅ **Same PDF output** as newly created invoices

### **Proper Error Handling:**
- ✅ **Detailed logging** for debugging
- ✅ **Null checks** for missing data
- ✅ **Graceful failure** with proper error messages

## Expected Result
After this fix:
1. **Missing PDF files** will be properly regenerated
2. **Regenerated PDFs** will have the same content as original PDFs
3. **Template data** will be complete and properly formatted
4. **Error 404** should no longer occur for valid invoices
5. **Users** will be able to download invoices from the list

## Files Modified
- `store-app/src/services/invoice.service.ts` - Fixed `regeneratePdf` method

## Testing
The fix should resolve the 404 error for invoice ID 94 and any other invoices with missing PDF files. The regenerated PDFs should contain all the proper invoice information with correct formatting and totals.
