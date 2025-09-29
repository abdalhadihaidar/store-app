import puppeteer, { Browser } from 'puppeteer';
import * as path from 'path';

export interface PuppeteerConfig {
  headless?: boolean | 'new';
  args?: string[];
  executablePath?: string;
  timeout?: number;
}

export function getPuppeteerConfig(): PuppeteerConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const baseConfig: PuppeteerConfig = {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--run-all-compositor-stages-before-draw',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ],
    timeout: 30000
  };

  if (isProduction) {
    // Production-specific configuration
    const possiblePaths = [
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/opt/google/chrome/chrome',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ];

    // Try to find Chrome executable
    for (const chromePath of possiblePaths) {
      try {
        require('fs').accessSync(chromePath);
        baseConfig.executablePath = chromePath;
        console.log(`✅ Found Chrome executable at: ${chromePath}`);
        break;
      } catch (error) {
        // Continue to next path
      }
    }

    if (!baseConfig.executablePath) {
      console.warn('⚠️ Chrome executable not found, using default Puppeteer bundled Chrome');
    }
  }

  return baseConfig;
}

export async function launchPuppeteer(): Promise<Browser> {
  const config = getPuppeteerConfig();
  
  try {
    console.log('🚀 Launching Puppeteer with config:', {
      headless: config.headless,
      executablePath: config.executablePath ? 'Found' : 'Default',
      argsCount: config.args?.length || 0
    });

    const browser = await puppeteer.launch(config as any);
    console.log('✅ Puppeteer launched successfully');
    return browser;
  } catch (error: any) {
    console.error('❌ Failed to launch Puppeteer:', error.message);
    
    // Fallback: try with minimal config
    console.log('🔄 Trying fallback configuration...');
    const fallbackConfig = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    };

    try {
      const browser = await puppeteer.launch(fallbackConfig);
      console.log('✅ Puppeteer launched with fallback config');
      return browser;
    } catch (fallbackError: any) {
      console.error('❌ Fallback Puppeteer launch also failed:', fallbackError.message);
      throw new Error(`Puppeteer launch failed: ${error.message}. Fallback also failed: ${fallbackError.message}`);
    }
  }
}
