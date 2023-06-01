import { AppSyncResolverEvent } from 'aws-lambda'
import { FB_COOKIES } from '../../test/cookies'
import { createBrowser } from '../../utils/puppeteer-util'

type Arguments = {
  url: string
}

type FBPost = {
  url: string
  content: string
  image: string
}

exports.handler = async (event: AppSyncResolverEvent<Arguments, FBPost>) => {
  console.log('request:', JSON.stringify(event, undefined, 2))
  const {
    arguments: { url },
    info,
  } = event
  if (info.fieldName === 'crawlFBPost') {
    let browser
    let page
    try {
      browser = await createBrowser()
      page = await browser.newPage()
      await page.setCookie(...FB_COOKIES)
      await page.goto(url)
      const image = await page.$eval(
        "head > meta[property='og:image']",
        element => element.content
      )
      const content = await page.$eval(
        "head > meta[property='og:image:alt']",
        element => element.content
      )

      return {
        url,
        image,
        content,
      }
    } finally {
      if (page) await page.close()
      if (browser) await browser.close()
    }
  }
  return null
}
