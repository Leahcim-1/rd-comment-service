import Router from '@koa/router'
import fs from 'fs'
import path from 'path'
import CommentService from '../service/comment-service.js'
import ERRNO from '../service/err-code.js'

const router = new Router()

// Check Conn Config
const configPath = path.resolve('conn-config.json')
if (!fs.existsSync(configPath)) throw Error('Database Connection Info Config File Not Found')
const connInfo = JSON.parse(fs.readFileSync(configPath, { encoding: 'utf-8' }))

// Create Comment Service
const commentService = new CommentService(connInfo)

/**
 * The factory function for creating response body
 * @param {Errno} message
 * @param {Object} data
 * @param {Array} links
 * @returns
 */
function createResBody (message, data, links = []) {
  return {
    message,
    data,
    links
  }
}

/*
 * Router Below
 */

router.get('/', ({ res }) => {
  res.end('Hello, this is Bender, the bending machine')
})

router.get('/api', ({ res }) => {
  res.end('Hello, this is Bender, the bending machine')
})

/**
 * @METHOD GET
 * @PATH /comment
 */
router.get('/api/comments', async ({ request, qs, response }) => {
  console.log(request.querystring)

  const { fields = '', limit = '10', offset = '0' } = qs

  const field = fields ? fields.split(',') : []

  const { errno, res } = await commentService.getAllComments(
    field,
    parseInt(limit, 10),
    parseInt(offset, 10)
  )
  const responseCodeMap = {
    [ERRNO.OK]: 200,
    [ERRNO.DBERR]: 500,
    [ERRNO.UN]: 500
  }

  response.status = responseCodeMap[errno]

  const links = response.status === 200 && res.length > 0
    ? [{ rel: 'cur', link: `/api/comments?limit=${limit}&offset=${offset}` }]
    : []

  response.body = createResBody(errno, res, links)
})

/**
 * @METHOD GET
 * @PATH /comment/:id
 */
router.get('/api/comments/:id', async ({ qs, response, params }) => {
  const { id } = params
  const { fields = '' } = qs
  const field = fields ? fields.split(',') : []

  const { errno, res } = await commentService.getCommentById(id, field)
  const responseCodeMap = {
    [ERRNO.OK]: res.length === 0 ? 404 : 200,
    [ERRNO.DBERR]: 500,
    [ERRNO.UN]: 500
  }
  response.status = responseCodeMap[errno]
  response.body = createResBody(errno, res)
})

/**
 * @METHOD POST
 * @PATH /comment
 */
router.post('/api/comments', async ({ request, response }) => {
  const {
    title = '',
    subtitle = '',
    author_id = '',
    author_name = '',
    tags = [],
    body = ''
  } = request.body

  if (!title ||
    !subtitle ||
    !author_id ||
    !author_name,
    !body) {
    response.status = 400
    response.body = createResBody(ERRNO.BADPARAMS)
    return
  }

  const { res, errno } = await commentService.postComment({
    title,
    subtitle,
    author_id,
    author_name,
    tags,
    body
  })


  const responseCodeMap = {
    [ERRNO.OK]: 201,
    [ERRNO.UN]: 500,
    [ERRNO.DUPID]: 400,
    [ERRNO.DUPTITLE]: 409,
    [ERRNO.DBERR]: 500,
  }
  response.status = responseCodeMap[errno]
  response.body = createResBody(errno, res)
})

/**
 * @METHOD PUT
 * @PATH /comment
 */
router.put('/api/comments/:id', async ({ params, request, response }) => {
  const { id } = params
  const {
    title = '',
    subtitle = '',
    tags = '',
    body = '',
  } = request.body

  // filter empty field
  const data = {
    title,
    subtitle,
    tags,
    body
  }
  
  for (const [key, val] of Object.entries(data)) {
    if (!val) delete data[key]
  }

  // Comment Service
  const { errno, res } = await commentService.updateComment(id, data)
  const responseCodeMap = {
    [ERRNO.OK]: 202,
    [ERRNO.NOEXIST]: 400,
    [ERRNO.DUPTITLE]: 409,
    [ERRNO.DBERR]: 500,
    [ERRNO.UN]: 500,
  }
  response.status = responseCodeMap[errno]
  response.body = createResBody(errno, res)
})

/**
 * @METHOD DELETE
 * @PATH /comment/:id
 */
router.delete('/api/comments/:id', async ({ params, response }) => {
  const { id } = params

  const { errno, res } = await commentService.delete(id)
  const responseCodeMap = {
    [ERRNO.OK]: 200,
    [ERRNO.UN]: 500,
    [ERRNO.NOEXIST]: 400,
  }
  response.status = responseCodeMap[errno]
  response.body = createResBody(errno, res)
})

export default router
