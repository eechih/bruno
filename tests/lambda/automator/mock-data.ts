import moment from 'moment'

import { Product } from '../../../lambda/product/types'
import { util } from '../../../utils'

export const mockOwner = 'mock_owner'

export const mockSettings = {
  owner: mockOwner,
  fbCookie: {
    datr: 'MDemZHYQB1iIZ9RAi3SlRxaU',
    fr: '0NsbTj647IZUI9Ls1.AWUVNZlkICEBtoLGl_TmtHN9wmg.Bkq2YH.6V.AAA.0.0.Bkq2YH.AWX_VbnmQAs',
    sb: 'zwMIZK3hoow9jI0BySMHEFm7',
    wd: '998x975',
    xs: '44%3AslihFmvB_vl9eg%3A2%3A1687916522%3A-1%3A11303%3A%3AAcVNIUVwsfPvG_nbj0MJKkZxiCgfdF2i0D-Q3IkDew',
    c_user: '200000236390565',
    updatedAt: util.time.nowISO8601(),
  },
  bp1Cookie: {
    __Secure_PHPSESSID: 'sgmvt45e5lsav8qgc64941bbe0',
    cf_bm:
      'jicy2btOzsV2UEpwvn7hQzSVbGgF7n8cqr8iXl02eq8-1688954438-0-AZ+EcknoOrqZFU3SoBQEJO2b9dCUcoc/WztYBNjH4S4BpRRdYpJEPsGyTjPowtdn6w==',
    currency: 'TWD',
    updatedAt: util.time.nowISO8601(),
  },
  createdAt: util.time.nowISO8601(),
}

export const mockProduct: Product = {
  id: 'mock',
  name: 'test name',
  description: 'test description',
  price: 100,
  cost: 90,
  offShelfAt: moment().add(7, 'days').toISOString(),
  options: [
    ['M', 'L'],
    ['red', 'blue'],
  ],
  images: ['private/069df0d8-3694-4ea1-b264-f9fbc8592eb2/mock.jpg'],
  provider: 'test',
  fbMessage: 'test test test',
  fbGroupId: '384011198690249',
  owner: mockOwner,
}
