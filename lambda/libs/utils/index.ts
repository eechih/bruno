import { isEmpty, isNil } from 'ramda'
import { v4 as uuidv4 } from 'uuid'

const util = {
  autoId: (): string => {
    return uuidv4()
  },

  isNumeric: (value: string): boolean => /^\d+$/.test(value),

  nonEmpty: (value: any): boolean => !isNil(value) && !isEmpty(value),

  base64Encode: (text: string): string =>
    Buffer.from(text, 'utf8').toString('base64'),

  base64Decode: (encoded: string): string =>
    Buffer.from(encoded, 'base64').toString('utf8'),
}

export { util }
