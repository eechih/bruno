import { isEmpty, isNil } from 'ramda'
import { v4 as uuidv4 } from 'uuid'
import { toUpdateCommand } from './dynamodb-util'

const nowISO8601 = (): string => new Date().toISOString()
const autoId = (): string => uuidv4()
const isNumeric = (value: string): boolean => /^\d+$/.test(value)
const nonEmpty = (value: any): boolean => !isNil(value) && !isEmpty(value)
const base64Encode = (text: string): string =>
  Buffer.from(text, 'utf8').toString('base64')
const base64Decode = (encoded: string): string =>
  Buffer.from(encoded, 'base64').toString('utf8')
const nullIfEmpty = <T>(value: T): T | null => {
  if (isEmpty(value)) return null
  return value
}
const undefinedIfEmpty = <T>(value: T): T | undefined => {
  if (isEmpty(value)) return undefined
  return value
}

export const util = {
  autoId,
  isNumeric,
  nonEmpty,
  base64Encode,
  base64Decode,
  toUpdateCommand,
  nullIfEmpty,
  undefinedIfEmpty,
  time: {
    nowISO8601,
  },
}
