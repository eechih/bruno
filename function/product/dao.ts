import BaseDAO, { QueryProps, QueryResult } from '../base/baseDao'
import { Product } from './models'

class ProcuctDAO extends BaseDAO<{ id: string }, Product> {
  constructor(tableName?: string) {
    super(tableName ?? (process.env.TABLE_NAME || ''))
  }

  query = async (
    props: QueryProps & { owner: string }
  ): Promise<QueryResult<Product>> => {
    console.log('ProcuctDAO.query', props)
    const { owner, limit, nextToken, order } = props
    try {
      return await this.queryItems({
        indexName: 'byOwner',
        keyConditionExpression: 'owner = :owner',
        expressionAttributeValues: { ':owner': owner },
        limit,
        order,
        nextToken,
      })
    } catch (err) {
      console.error(err)
      throw err
    }
  }
}

export { ProcuctDAO }
