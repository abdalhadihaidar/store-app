import puppeteer from 'puppeteer';

export function getPuppeteerConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const baseConfig = {
    headless: 'new' as const,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--single-process',
      '--no-first-run',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-images',
      '--disable-javascript',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-background-networking',
      '--disable-sync',
      '--disable-translate',
      '--hide-scrollbars',
      '--mute-audio',
      '--no-zygote',
      '--disable-ipc-flooding-protection',
      '--disable-hang-monitor',
      '--disable-prompt-on-repost',
      '--disable-domain-reliability',
      '--disable-client-side-phishing-detection',
      '--disable-component-extensions-with-background-pages',
      '--disable-background-downloads',
      '--disable-add-to-shelf',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-default-apps',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-features=TranslateUI',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-sync',
      '--disable-translate',
      '--disable-windows10-custom-titlebar',
      '--metrics-recording-only',
      '--no-first-run',
      '--safebrowsing-disable-auto-update',
      '--enable-automation',
      '--password-store=basic',
      '--use-mock-keychain',
      '--disable-blink-features=AutomationControlled'
    ]
  };

  if (isProduction) {
    // Production-specific configuration for Render.com
    return {
      ...baseConfig,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
      args: [
        ...baseConfig.args,
        '--disable-dev-shm-usage',
        '--memory-pressure-off',
        '--max_old_space_size=4096',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-hang-monitor',
        '--disable-prompt-on-repost',
        '--disable-sync',
        '--disable-translate',
        '--disable-windows10-custom-titlebar',
        '--metrics-recording-only',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
        '--enable-automation',
        '--password-store=basic',
        '--use-mock-keychain',
        '--disable-blink-features=AutomationControlled'
      ]
    };
  }

  return baseConfig;
}

export async function launchPuppeteer() {
  const config = getPuppeteerConfig();
  const isProduction = process.env.NODE_ENV === 'production';
  
  try {
    console.log('🔧 Launching Puppeteer with config:', {
      headless: config.headless,
      executablePath: 'executablePath' in config ? config.executablePath : 'default',
      argsCount: config.args.length
    });
    
    const browser = await puppeteer.launch(config);
    console.log('✅ Puppeteer launched successfully');
    return browser;
  } catch (error: any) {
    console.error('❌ Failed to launch Puppeteer:', error);
    
    // Try fallback configuration
    console.log('🔄 Trying fallback configuration...');
    const fallbackConfig = {
      headless: 'new' as const,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process'
      ],
      ...(isProduction && process.env.PUPPETEER_EXECUTABLE_PATH ? {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
      } : {})
    };
    
    try {
      const browser = await puppeteer.launch(fallbackConfig);
      console.log('✅ Puppeteer launched with fallback config');
      return browser;
    } catch (fallbackError: any) {
      console.error('❌ Fallback configuration also failed:', fallbackError);
      throw new Error(`Puppeteer launch failed: ${error?.message || 'Unknown error'}. Fallback also failed: ${fallbackError?.message || 'Unknown error'}`);
    }
  }
}
