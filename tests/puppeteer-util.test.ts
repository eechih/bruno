import { createBrowser } from '../lambda/libs/utils/puppeteer-util'

import { FB_COOKIES } from './cookies'

test.skip('Puppeteer Browser Created', async () => {
  const browser = await createBrowser()
  const page = await browser.newPage()
  await page.setCookie(...FB_COOKIES)
  await page.goto(
    'https://www.facebook.com/groups/1627303077535381/posts/3459253157673688/'
  )
  const image = await page.$eval(
    "head > meta[property='og:image']",
    element => element.content
  )
  console.log('image', image)
  const text = await page.$eval(
    "head > meta[property='og:image:alt']",
    element => element.content
  )
  console.log('text', text)
  await page.close()
  await browser.close()
}, 60000)
