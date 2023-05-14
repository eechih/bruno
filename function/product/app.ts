import bodyParser from 'body-parser'
import compression from 'compression'
import cors from 'cors'
import express, { Request, Response } from 'express'

import { getUniqueId, nonEmpty, safeParseInt } from '../base/commomUtils'
import { Patch, ProcuctDAO } from './dao'
import { Product } from './models'

const owner = 'test'
const dao = new ProcuctDAO()

async function creageProjecthandler(req: Request, res: Response) {
  const data = { ...req.body, owner, id: getUniqueId() } as Product
  if (data.cost) data.cost = Number(data.cost)
  if (data.price) data.price = Number(data.price)
  const product = await dao.create(data)
  return res.json(product)
}

async function listProjectsHandler(req: Request, res: Response) {
  const { limit, order, nextToken } = req.query
  const data = await dao.query({
    owner,
    limit: safeParseInt(limit as string),
    order: order as 'asc' | 'desc',
    nextToken: nextToken as string,
  })
  return res.json(data)
}

async function getProjectHandler(req: Request, res: Response) {
  const { id } = req.params
  const product = await dao.get({ id })
  if (product) return res.json(product)
  return res.status(404).json({ message: 'Invalid id' })
}

async function updateProjectHandler(req: Request, res: Response) {
  const { id } = req.params
  const data = { ...req.body, id, owner } as Product
  if (data.cost) data.cost = Number(data.cost)
  if (data.price) data.price = Number(data.price)
  const product = await dao.update(data)
  return res.json(product)
}

async function patchProjectHandler(req: Request, res: Response) {
  const { id } = req.params
  const patches = req.body as Patch[]
  patches.forEach(patch => {
    if (['cost', 'price'].includes(patch.path))
      patch.value = Number(patch.value)
  })
  if (!nonEmpty(patches))
    return res.status(400).json({ message: 'Bad Request' })

  const product = await dao.patch({
    key: { id },
    patches,
  })
  return res.status(200).json(product)
}

async function deleteProjectHandler(req: Request, res: Response) {
  const { id } = req.params
  const product = await dao.delete({ id })
  return res.json(product)
}

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

router.post('/products', creageProjecthandler)
router.get('/products', listProjectsHandler)
router.get('/products/:productId', getProjectHandler)
router.put('/products/:productId', updateProjectHandler)
router.patch('/products/:productId', patchProjectHandler)
router.delete('/products/:productId', deleteProjectHandler)
router.put('/products/:productId/publish', handler)

router.post('/products/sqs', handler)

export { app }
