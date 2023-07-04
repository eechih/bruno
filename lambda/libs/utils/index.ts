import { isEmpty, isNil } from 'ramda'
import { v4 as uuidv4 } from 'uuid'

const nowISO8601 = (): string => new Date().toISOString()
const autoId = (): string => uuidv4()
const isNumeric = (value: string): boolean => /^\d+$/.test(value)
const nonEmpty = (value: any): boolean => !isNil(value) && !isEmpty(value)
const base64Encode = (text: string): string =>
  Buffer.from(text, 'utf8').toString('base64')
const base64Decode = (encoded: string): string =>
  Buffer.from(encoded, 'base64').toString('utf8')

export const util = {
  autoId,
  isNumeric,
  nonEmpty,
  base64Encode,
  base64Decode,
  time: {
    nowISO8601,
  },
}
