import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

const createBrowser = async () => {
  const isAWS = __dirname === '/var/task'
  if (isAWS)
    return await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      // reference: https://github.com/Sparticuz/chromium/issues/24#issuecomment-1334580490
      executablePath: await chromium.executablePath(
        '/opt/nodejs/node_modules/@sparticuz/chromium/bin'
      ),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    })
  else {
    let executablePath = ''
    // MacOS
    if (process.platform === 'darwin') {
      executablePath =
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    }
    // Ubuntu
    else if (process.platform === 'linux') {
      executablePath = '/usr/bin/google-chrome-stable'
    }
    return await puppeteer.launch({
      defaultViewport: { width: 1440, height: 700 },
      executablePath,
      headless: false,
      args: ['--disable-notifications=true'],
    })
  }
}

export { createBrowser }
