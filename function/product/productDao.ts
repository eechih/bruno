import BaseDAO, { QueryProps, QueryResult } from '../base/baseDao'
import { Product } from './models'

type K = { userId: string; productId: string }
type D = Product

export default class ProcuctDAO extends BaseDAO<K, D> {
  constructor(tableName?: string) {
    super(tableName ?? (process.env.TABLE_NAME || ''))
  }

  query = async (
    props: QueryProps & { owner: string }
  ): Promise<QueryResult<D>> => {
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
