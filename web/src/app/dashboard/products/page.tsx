import { Amplify } from 'aws-amplify'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import awsConfig from '@/aws-exports'
import { getAllProducts } from '@/lib/functions'
import { Product } from '@/lib/types'

Amplify.configure(awsConfig)

async function Page() {
  const products = await getAllProducts()

  // No products? Bail...
  if (!products) {
    notFound()
  }

  return (
    <>
      <ol>
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/dashboard">Dashboard</Link>
        </li>
      </ol>
      <ol>
        {products.map((product: Product, index) => (
          <li key={index}>
            {product.id} - {product.name}
          </li>
        ))}
      </ol>
    </>
  )
}

export default Page
