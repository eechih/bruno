import bodyParser from 'body-parser'
import compression from 'compression'
import cors from 'cors'
import express, { Request, Response } from 'express'

async function handler(req: Request, res: Response) {
  return res.json({
    url: req.url,
    headers: req.headers,
    method: req.method,
    path: req.path,
    params: req.params,
    query: req.query,
    body: req.body,
  })
}

const app = express()
app.use(bodyParser.json())
const router = express.Router()
app.use('/', router)

router.use(compression())
router.use(cors())
router.use(express.json())
router.use(express.urlencoded({ extended: true }))

router.post('/products', handler)
router.get('/products', handler)
router.get('/products/:productId', handler)
router.put('/products/:productId', handler)
router.patch('/products/:productId', handler)
router.put('/products/:productId/publish', handler)

router.post('/products/sqs', handler)

export { app }
