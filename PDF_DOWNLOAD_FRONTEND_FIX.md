# PDF Download Frontend Fix

## Problem Description
PDF files were being downloaded but couldn't be opened. The issue was that the frontend was not handling the correct MIME types for PDF vs HTML fallback files.

## Root Cause
1. **Backend generates valid PDFs** (confirmed by checking file headers: `%PDF-1.7`)
2. **Backend sets correct Content-Type headers** (`application/pdf` or `text/html`)
3. **Frontend was ignoring Content-Type headers** and always creating blobs with `application/pdf` MIME type
4. **Browser couldn't open files** because MIME type didn't match actual content

## Solution Implemented

### Fixed Frontend API Functions

1. **`dashboard/src/api/angebots.api.js`**:
   - `downloadAngebotPdf()` - Now reads Content-Type header and creates blob with correct MIME type
   - Handles both PDF and HTML fallback files correctly

2. **`dashboard/src/api/invoice.api.js`**:
   - `createInvoice()` - Now reads Content-Type header
   - `downloadInvoice()` - Now reads Content-Type header  
   - `createCreditNote()` - Now reads Content-Type header
   - `downloadCreditNote()` - Now reads Content-Type header

### Key Changes

**Before:**
```javascript
const blob = new Blob([res.data], { type: 'application/pdf' }); // Always PDF
```

**After:**
```javascript
const contentType = res.headers['content-type'] || 'application/pdf';
const blob = new Blob([res.data], { type: contentType }); // Correct MIME type
```

### How It Works Now

1. **Backend sends file** with correct `Content-Type` header:
   - `application/pdf` for actual PDF files
   - `text/html` for HTML fallback files

2. **Frontend reads the header** and creates blob with matching MIME type

3. **Browser can properly open** the file because MIME type matches content

4. **Filename extension** is also determined from Content-Type for HTML fallbacks

## Files Modified
- `dashboard/src/api/angebots.api.js`
- `dashboard/src/api/invoice.api.js`

## Testing
After this fix:
1. PDF downloads should open correctly in browser/PDF viewer
2. HTML fallback files should open in browser as web pages
3. No more "We can't open this file" errors
4. Files should have correct extensions (.pdf or .html)

## Related Backend Fixes
- Added PDF regeneration fallback in controllers
- Fixed TypeScript compilation errors in `puppeteer.config.ts`
- Enhanced error handling for PDF generation failures
