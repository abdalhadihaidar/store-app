# Render.com Deployment Guide

## Changes Made for Render.com Compatibility

### 1. Fixed Puppeteer Configuration
- **Removed Chrome installation** from `package.json` postinstall script
- **Updated render.yaml** to use system Chrome (`/usr/bin/google-chrome-stable`)
- **Enhanced Puppeteer config** with Render.com-specific arguments

### 2. Key Changes

#### package.json
```json
{
  "scripts": {
    "postinstall": "npm run build"  // Removed Chrome installation
  }
}
```

#### render.yaml
```yaml
services:
  - type: web
    name: store-app
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PUPPETEER_EXECUTABLE_PATH
        value: /usr/bin/google-chrome-stable
```

#### Puppeteer Configuration
- Uses system Chrome instead of installing during build
- Includes Render.com-specific Chrome arguments
- Enhanced fallback mechanism for production environment

## Deployment Steps

1. **Commit and push** your changes to the repository
2. **Redeploy** on Render.com - the build should now succeed
3. **Monitor logs** for any Puppeteer-related issues

## Troubleshooting

If you still encounter issues:

1. **Check Render logs** for Puppeteer launch errors
2. **Verify environment variables** are set correctly
3. **Test locally** with `NODE_ENV=production` to simulate Render environment

## Environment Variables Required

- `NODE_ENV=production`
- `PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable`

The deployment should now work without permission errors!


















