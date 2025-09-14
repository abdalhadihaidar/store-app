# All Templates Headers and Bank Details Fix

## Problem
The same table header misalignment and missing bank details issues existed in **all PDF templates** - not just invoices. All templates needed the same fixes.

## Templates Fixed

### 1. Invoice Template ✅ (Previously Fixed)
- Fixed table headers alignment
- Added bank details display
- Added `isLastPage: true` to template data

### 2. Angebot Template ✅ (Newly Fixed)
- Fixed table headers alignment  
- Fixed validity information display
- Added `isLastPage: true` to template data

### 3. Credit Note Template ✅ (Newly Fixed)
- Fixed table headers alignment
- Fixed bank details display
- Added `isLastPage: true` to template data

## Changes Made to Each Template

### Table Headers Fix (All Templates)
```html
<!-- Before: Misaligned -->
<th style="width: 15%;" colspan="2">enthaltene MwSt</th>
<!-- Sub-headers -->
<th style="width: 12%;">pro Artikel</th>
<th style="width: 7.5%;">7%</th>
<th style="width: 7.5%;">19%</th>

<!-- After: Properly Aligned -->
<th style="width: 15%;" colspan="3">enthaltene MwSt</th>
<!-- Sub-headers -->
<th style="width: 5%;">7%</th>
<th style="width: 5%;">19%</th>
<th style="width: 5%;">pro Artikel</th>
```

### Data Rows Fix (All Templates)
```html
<!-- Before: 2 columns -->
<% if (item.tax7 > 0) { %>
  <td><%= tax7.toFixed(2) %>€</td>
  <td>0€</td>
<% } %>

<!-- After: 3 columns -->
<% if (item.tax7 > 0) { %>
  <td><%= tax7.toFixed(2) %>€</td>  <!-- 7% tax -->
  <td>0€</td>                        <!-- 19% tax -->
  <td><%= tax7.toFixed(2) %>€</td>  <!-- per item -->
<% } %>
```

### Footer Information Fix (All Templates)
```html
<!-- Before: Only showed when explicitly set -->
<% if (typeof isLastPage !== 'undefined' && isLastPage === true) { %>

<!-- After: Shows by default -->
<% if (typeof isLastPage === 'undefined' || isLastPage === true) { %>
```

## Service Updates

### 1. Invoice Service ✅
```typescript
const templateData = {
  // ... existing fields ...
  isLastPage: true // Always show bank details for invoices
};
```

### 2. Angebot Service ✅
```typescript
const templateData = {
  // ... existing fields ...
  isLastPage: true // Always show validity information for angebots
};
```

### 3. Credit Note Service ✅
```typescript
const templateData = {
  // ... existing fields ...
  isLastPage: true // Always show bank details for credit notes
};
```

## Footer Information by Template

### Invoice Footer
- **Bank Details**: IBAN, BIC, Bank, Address, Purpose
- **Purpose**: Payment information for invoices

### Angebot Footer
- **Validity Information**: Duration, Acceptance, Prices, Payment terms, Delivery terms
- **Purpose**: Terms and conditions for offers

### Credit Note Footer
- **Bank Details**: IBAN, BIC, Bank, Address, Purpose
- **Purpose**: Refund information for credit notes

## Files Modified

### Template Files
- `store-app/templates/invoice.ejs` ✅
- `store-app/templates/angebot.ejs` ✅
- `store-app/templates/creditNote.ejs` ✅

### Service Files
- `store-app/src/services/invoice.service.ts` ✅
- `store-app/src/services/angebot.service.ts` (via pdf.util.ts) ✅
- `store-app/src/services/creditNote.service.ts` ✅

### Utility Files
- `store-app/src/utils/pdf.util.ts` (angebot template data) ✅

## Expected Results

### All PDF Templates Now Have:
- ✅ **Properly aligned table headers** with correct tax column structure
- ✅ **Complete footer information** always visible
- ✅ **Professional formatting** matching business standards
- ✅ **Consistent structure** across all document types

### User Experience:
- ✅ **Invoices**: Complete with bank details for payments
- ✅ **Angebots**: Complete with validity terms and conditions
- ✅ **Credit Notes**: Complete with bank details for refunds
- ✅ **All Documents**: Professional appearance with proper table alignment

## Testing
After deployment, all PDF templates should display:
1. **Properly aligned table headers** with correct tax column structure
2. **Complete footer information** appropriate for each document type
3. **Professional appearance** matching business standards
4. **Consistent formatting** across all document types

All PDF templates are now complete and professional!
