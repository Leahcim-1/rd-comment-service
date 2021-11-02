import MySQL from '../db/MySQL-Service.js'
import Logger from '../util/logger.js'
import ERRNO from './err-code.js'

export default class CommentService {
  constructor (connInfo) {
    this.sql = new MySQL(connInfo)
    this.schema = 'comment'
    this.table = 'comment_table'
  }

  createRes (errno, res = []) {
    return {
      errno,
      res
    }
  }

  async executeWithTry (fn = () => {}, isReturning = true) {
    try {
      const res = await fn()
      return this.createRes(ERRNO.OK, isReturning ? res : {})
    } catch (e) {
      Logger.log(e)
      return this.createRes(ERRNO.DBERR, e)
    }
  }

  async checkExistedId (id) {
    // * Check existed ID
    const condition = this.sql.createColumnValueCondition('id', id)
    const record = await this.getCommentByCondition(condition)
    return record &&
        record.errno === ERRNO.OK &&
        record.res.length !== 0
  }

  async checkExistedTitle (title) {
    // * Check existed ID
    const condition = this.sql.createColumnValueCondition('title', title)
    const record = await this.getCommentByCondition(condition)
    return record &&
        record.errno === ERRNO.OK &&
        record.res.length !== 0
  }


  async checkNonExistedId (id) {
    // * Check non-existed ID
    const condition = this.sql.createColumnValueCondition('id', id)
    const record = await this.getCommentByCondition(condition)
    return record &&
        record.errno === ERRNO.OK &&
        record.res.length === 0
  }

  async getAllComments (fields = [], limit = 10, offset = 0) {
    const fn = this.sql.selectStatement(this.schema, this.table, fields, limit, offset)
    return await this.executeWithTry(fn, true)
  }

  async getCommentByCondition (condition, fields = [], limit = 10, offset = 0) {
    const fn = async () => await this.sql.selectStatement(
      this.schema,
      this.table,
      fields,
      limit,
      offset
    )(condition)
    return await this.executeWithTry(fn, true)
  }

  async getCommentById (id, fields = []) {
    const condition = this.sql.createColumnValueCondition('id', id)
    return await this.getCommentByCondition(condition, fields)
  }

  async getCommentByBlogId (blogId, fields = []) {
    const condition = this.sql.createColumnValueCondition('blog_id', blogId)
    return await this.getCommentByCondition(condition, fields)
  }

  async postComment (data) {
    const {
      body,
      blog_id,
      user_id ,
      user_name,
    } = data
    
    // * Created Time 
    const created_time = (new Date()).getTime()
  
    const fn = async () => await this.sql.insertStatement(this.schema, this.table, {
      body,
      blog_id,
      user_id ,
      user_name,
      created_time,
    })
    return await this.executeWithTry(fn, false)
  }

  async updateComment (id, data = {}) {
    // * Check Comment Existed
    const nonExisted = await this.checkNonExistedId(id)
    if (nonExisted) return this.createRes(ERRNO.NOEXIST)

    // execute PUT
    const condition = this.sql.createColumnValueCondition('id', id)
    const fn = async () => await this.sql.updateStatement(
      this.schema,
      this.table,
      condition,
      data
    )
    return await this.executeWithTry(fn, false)
  }

  async delete (id) {
    // * Check Comment Non-existed
    const nonExisted = await this.checkNonExistedId(id)
    if (nonExisted) return this.createRes(ERRNO.NOEXIST)
    
    const condition = this.sql.createColumnValueCondition('id', id)
    const fn = async () => await this.sql.deleteStatement(
      this.schema,
      this.table,
      condition
    )
    return await this.executeWithTry(fn, false)
  }
}
