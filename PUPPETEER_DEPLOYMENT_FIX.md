# Puppeteer Chrome Installation Fix for Production

## Problem
The application was failing with a 500 error when creating invoices because Puppeteer couldn't find Chrome on the production server. The error message was:

```
Puppeteer launch failed: Failed to launch the browser process! spawn /usr/bin/google-chrome-stable ENOENT
```

## Solution Implemented

### 1. Updated Dockerfile
- Added Chromium installation to the Alpine Linux container
- Set environment variables to tell Puppeteer to use the installed Chromium
- Added all necessary dependencies for Chromium to work properly

### 2. Enhanced Puppeteer Configuration
- Updated the configuration to prioritize Chromium paths
- Added better fallback mechanisms
- Improved error handling and logging

### 3. HTML Fallback Mechanism
- Added HTML fallback for invoice generation when Puppeteer fails
- Updated controllers to handle both PDF and HTML files
- Maintained functionality even when PDF generation fails

## Files Modified

1. **Dockerfile** - Added Chromium installation and environment variables
2. **src/utils/puppeteer.config.ts** - Updated Chrome path detection
3. **src/utils/pdf.util.ts** - Added HTML fallback for invoices
4. **src/controllers/invoice.controller.ts** - Updated to handle HTML files

## Deployment Steps

### For Docker Deployment:
1. Rebuild your Docker image:
   ```bash
   docker build -t your-app-name .
   ```

2. Deploy the new image to your server

### For Render.com or similar platforms:
1. Push your changes to your repository
2. The platform will automatically rebuild using the updated Dockerfile
3. The new deployment will include Chromium installation

## Testing

After deployment, you can test the Puppeteer functionality by:

1. **Test endpoint** (if available): `GET /api/angebots/test-puppeteer`
2. **Create an invoice**: Try creating an invoice through the normal flow
3. **Check logs**: Look for Puppeteer-related success messages

## Expected Behavior

- **Primary**: PDF generation should work with Chromium
- **Fallback**: If PDF generation fails, HTML files will be generated instead
- **User Experience**: Users will receive either a PDF or HTML file, maintaining functionality

## Troubleshooting

If you still encounter issues:

1. **Check Chrome installation**:
   ```bash
   docker exec -it your-container-name /usr/bin/chromium-browser --version
   ```

2. **Verify environment variables**:
   ```bash
   docker exec -it your-container-name env | grep PUPPETEER
   ```

3. **Check logs** for Puppeteer-related messages

## Alternative Solutions

If Chromium installation doesn't work, consider:

1. **Using a different base image** with Chrome pre-installed
2. **Using a headless Chrome service** (external service)
3. **Using alternative PDF generation libraries** (like jsPDF)

## Environment Variables

The following environment variables are set in the Dockerfile:
- `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser`
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`

These ensure Puppeteer uses the system-installed Chromium instead of trying to download its own.
