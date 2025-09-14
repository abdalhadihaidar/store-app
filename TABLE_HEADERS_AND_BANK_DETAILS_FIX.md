# Table Headers and Bank Details Fix

## Problems Identified
1. **Table Headers Misalignment**: The "enthaltene MwSt" column headers were not properly aligned with the data columns
2. **Missing Bank Details**: Bank information was not showing in the invoice footer

## Root Causes
1. **Table Header Structure**: The "enthaltene MwSt" header spanned 2 columns but the sub-headers were misaligned
2. **Bank Details Condition**: The bank information was only shown when `isLastPage === true`, but this variable wasn't being set in the template data

## Solutions Implemented

### 1. Fixed Table Headers

#### Before (Misaligned):
```html
<th style="width: 15%;" colspan="2">enthaltene MwSt</th>
<!-- Sub-headers -->
<th style="width: 12%;">pro Artikel</th>
<th style="width: 7.5%;">7%</th>
<th style="width: 7.5%;">19%</th>
```

#### After (Properly Aligned):
```html
<th style="width: 15%;" colspan="3">enthaltene MwSt</th>
<!-- Sub-headers -->
<th style="width: 5%;">7%</th>
<th style="width: 5%;">19%</th>
<th style="width: 5%;">pro Artikel</th>
```

#### Data Rows Updated:
```html
<!-- Now includes 3 columns for tax data -->
<% if (item.tax7 > 0) { %>
  <td><%= (item.tax7 || 0).toFixed(2) %>€</td>  <!-- 7% tax -->
  <td>0€</td>                                    <!-- 19% tax -->
  <td><%= (item.tax7 || 0).toFixed(2) %>€</td>  <!-- per item -->
<% } else if (item.tax19 > 0) { %>
  <td>0€</td>                                    <!-- 7% tax -->
  <td><%= (item.tax19 || 0).toFixed(2) %>€</td> <!-- 19% tax -->
  <td><%= (item.tax19 || 0).toFixed(2) %>€</td> <!-- per item -->
<% } else { %>
  <td>0€</td><td>0€</td><td>0€</td>
<% } %>
```

### 2. Fixed Bank Details Display

#### Template Condition Updated:
```html
<!-- Before: Only showed when explicitly set -->
<% if (typeof isLastPage !== 'undefined' && isLastPage === true) { %>

<!-- After: Shows by default for invoices -->
<% if (typeof isLastPage === 'undefined' || isLastPage === true) { %>
```

#### Service Template Data Updated:
```typescript
const templateData = {
  // ... existing fields ...
  isLastPage: true // Always show bank details for invoices
};
```

## Bank Details Now Include:
- **IBAN**: DE44 8605 5592 1090 3534 28
- **BIC**: WELADE8LXXX
- **Bank**: Stadt- und kreissparkasse leipzig
- **Address**: Humboldtstraße 25, 04008 Leipzig 7
- **Purpose**: "Geben Sie bitte die Rechnungsnummer an!"

## Files Modified

### 1. Template File
- `store-app/templates/invoice.ejs`
  - Fixed table header structure and column spans
  - Updated data rows to match new header structure
  - Modified bank details condition to show by default

### 2. Service File
- `store-app/src/services/invoice.service.ts`
  - Added `isLastPage: true` to template data
  - Ensures bank details always show for invoices

## Expected Results

### Table Headers:
- ✅ **Properly aligned** "enthaltene MwSt" columns
- ✅ **Correct sub-headers**: 7%, 19%, pro Artikel
- ✅ **Matching data columns** for all tax calculations

### Bank Details:
- ✅ **Always visible** in invoice footer
- ✅ **Complete banking information** for payments
- ✅ **Professional formatting** with proper styling

### User Experience:
- ✅ **Professional invoice layout** with correct table structure
- ✅ **Complete payment information** always available
- ✅ **No missing bank details** in any invoice

## Testing
After deployment, invoices should display:
1. **Properly aligned table headers** with correct tax column structure
2. **Bank details in footer** with complete payment information
3. **Professional appearance** matching business standards

The invoice template is now complete and professional!
