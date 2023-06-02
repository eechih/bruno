import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import chromium from '@sparticuz/chromium'
import { AppSyncResolverEvent } from 'aws-lambda'
import moment from 'moment'
import puppeteer, { Browser, Page, Protocol } from 'puppeteer-core'

type Arguments = {
  postUrl: string
  newBrowser: boolean
}

type Nullable<T> = T | null

const REGION = process.env.REGION || process.env.AWS_REGION
const BUCKET_NAME = process.env.BUCKET_NAME || ''
console.log('REGION', REGION)
console.log('BUCKET_NAME', BUCKET_NAME)

const s3Client = new S3Client({ region: REGION })

let browser: Nullable<Browser> = null
let page: Nullable<Page> = null

exports.handler = async (event: AppSyncResolverEvent<Arguments>) => {
  console.log('request:', JSON.stringify(event, undefined, 2))
  const {
    arguments: { postUrl, newBrowser },
    info: { fieldName },
  } = event

  try {
    if (fieldName === 'crawlFBPost') {
      const startedAt = moment()
      if (browser !== null && newBrowser) {
        console.log('close all pages...')
        const pages = await browser?.pages()
        await Promise.all(pages.map(page => page.close()))
        page = null
        console.log('close previous browser...')
        await browser.close()
        browser = null
      }

      if (browser === null) {
        browser = await puppeteer.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(
            '/opt/nodejs/node_modules/@sparticuz/chromium/bin'
          ),
          headless: chromium.headless,
          ignoreHTTPSErrors: true,
        })
      }

      if (page === null) {
        page = await browser.newPage()
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: 'private/cookie/facebook/100000236390565.json',
        })
        const response = await s3Client.send(command)
        // The Body object also has 'transformToByteArray' and 'transformToWebStream' methods.
        const body = await response.Body?.transformToString()
        console.log('s3 object body', body)
        if (body) {
          const cookies = JSON.parse(body) as Protocol.Network.CookieParam[]
          console.log('cookies', cookies)
          await page.setCookie(...cookies)
        }
      }

      console.log('page goto', postUrl)
      await page.goto(postUrl, { waitUntil: 'domcontentloaded' })

      const message = await page.$eval(
        "head > meta[property='og:image:alt']",
        element => element.content
      )
      console.log('message', message)

      const image = await page.$eval(
        "head > meta[property='og:image']",
        element => element.content
      )
      console.log('image', image)

      const endedAt = moment()
      return {
        postUrl,
        message,
        image,
        crawledAt: endedAt.toISOString(),
        consumingTime: endedAt.unix() - startedAt.unix(),
      }
    }
  } catch (err) {
    console.log('Error:', err)
    throw err
  }

  return null
}
