# List Download Corruption Fix

## Problem Identified
- **HTML files created directly** (from creation pages) work fine ✅
- **Files downloaded from lists** are corrupted ❌

## Root Cause
The issue was in the **invoice download endpoint** (`downloadInvoice`). When a PDF file didn't exist, it was calling:

```typescript
// ❌ WRONG: Creates a new invoice instead of regenerating PDF
const regeneratedInvoice = await InvoiceService.create(invoice.orderId, null, {});
```

This was creating a **completely new invoice record** in the database instead of just regenerating the PDF for the existing invoice, causing data corruption and wrong file content.

## Fix Applied

### 1. Created New `regeneratePdf` Method
Added a new method in `InvoiceService` that only regenerates the PDF without creating a new invoice:

```typescript
static async regeneratePdf(invoiceId: number): Promise<Invoice | null> {
  // Get existing invoice with all associations
  const invoice = await Invoice.findByPk(invoiceId, { include: [...] });
  
  // Generate new PDF using existing invoice data
  const result = await generateInvoicePdf(invoice.order, invoice.order.items);
  
  // Update only the PDF path, don't create new invoice
  invoice.pdfPath = result.filePath;
  await invoice.save();
  
  return invoice;
}
```

### 2. Updated Download Endpoint
Changed the download endpoint to use the new method:

```typescript
// ✅ CORRECT: Regenerates PDF for existing invoice
const regeneratedInvoice = await InvoiceService.regeneratePdf(invoice.id);
```

## Comparison with Other Controllers

### ✅ Angebot Controller (Already Correct)
The angebot controller was already doing this correctly:
```typescript
// Regenerate PDF for existing angebot
const pdfResult = await generateAngebotPdf(fullAngebot, order, order.items);
await fullAngebot.update({ pdfPath: pdfResult.filePath });
```

### ❌ Credit Note Controller (Needs Fix)
The credit note controller doesn't have regeneration logic - it just returns 404 if file doesn't exist. This should be fixed too.

## Expected Behavior After Fix

### Before Fix:
1. User downloads invoice from list
2. File doesn't exist on server
3. System creates **new invoice** with different data
4. User gets corrupted file with wrong content

### After Fix:
1. User downloads invoice from list  
2. File doesn't exist on server
3. System regenerates PDF for **existing invoice**
4. User gets correct file with proper content

## Files Modified
- `store-app/src/services/invoice.service.ts` - Added `regeneratePdf` method
- `store-app/src/controllers/invoice.controller.ts` - Updated download endpoint

## Next Steps
1. **Deploy this fix** to resolve list download corruption
2. **Consider fixing credit note controller** to add regeneration logic
3. **Test list downloads** to ensure they now work correctly

This fix ensures that list downloads use the same data as creation downloads, eliminating the corruption issue.
