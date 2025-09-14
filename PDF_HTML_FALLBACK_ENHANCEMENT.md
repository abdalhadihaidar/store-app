# PDF/HTML Fallback Enhancement

## Problem Analysis
From the network request, we can see:
- ✅ Backend correctly generates HTML fallback (`content-type: text/html`)
- ✅ Backend sets correct filename (`filename=invoice_dsadas.html`)
- ❌ Frontend tries to download HTML as PDF, causing "Document Load Failed"

## Enhanced Solution

### Key Changes Made

1. **Smart File Handling**:
   - **PDF files**: Download normally (as before)
   - **HTML files**: Open in new browser tab instead of downloading

2. **Added Debug Logging**:
   - Console logs show content-type and filename detection
   - Helps identify whether file is PDF or HTML

3. **Improved User Experience**:
   - HTML invoices open directly in browser (better for viewing)
   - PDF invoices download for offline use
   - No more "Document Load Failed" errors

### Code Changes

**Before:**
```javascript
// Always downloads file, regardless of type
const blob = new Blob([res.data], { type: contentType });
link.download = filename;
link.click();
```

**After:**
```javascript
// Smart handling based on file type
if (isHtmlFile) {
  // Open HTML in new tab
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
} else {
  // Download PDF normally
  link.download = filename;
  link.click();
}
```

### Files Modified
- `dashboard/src/api/invoice.api.js` - `createInvoice()` function
- `dashboard/src/api/angebots.api.js` - `downloadAngebotPdf()` function

### Expected Behavior Now

1. **PDF Generation Success**: File downloads as PDF ✅
2. **HTML Fallback**: File opens in new browser tab ✅
3. **No More Errors**: No "Document Load Failed" messages ✅
4. **Better UX**: HTML files are immediately viewable ✅

### Testing Steps
1. Try generating an invoice/angebot
2. Check browser console for debug logs
3. If HTML fallback: Should open in new tab
4. If PDF: Should download normally
5. No more "Document Load Failed" errors

## Next Steps
1. Build and deploy the dashboard changes
2. Test the enhanced file handling
3. Verify both PDF and HTML scenarios work correctly
