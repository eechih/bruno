import { Amplify } from 'aws-amplify'
import { notFound } from 'next/navigation'

import awsConfig from '@/aws-exports'
import { getAllProducts } from '@/lib/functions'
import Box from '@/wrapped/material/Box'

import ProductDataGrid from './ProductDataGrid'

Amplify.configure(awsConfig)

async function Page() {
  const products = await getAllProducts()

  // No products? Bail...
  if (!products) {
    notFound()
  }

  return (
    <Box sx={{ width: '100%' }}>
      <ProductDataGrid products={products} />
    </Box>
  )
}

export default Page
