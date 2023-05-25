// 'use client'

import { Amplify } from 'aws-amplify'

import awsConfig from '@/aws-exports'
import WrappedBreadcrumbs from '@/components/shared/WrappedBreadcrumbs'
import { getProduct } from '@/lib/functions'
import Container from '@/wrapped/material/Container'
import ProductForm from '../ProductForm'

Amplify.configure(awsConfig)

type PageProps = {
  params: { productId: string }
}

async function Page({ params: { productId } }: PageProps) {
  let product
  if (productId && productId !== 'create') {
    product = await getProduct(productId)
  }
  return (
    <Container disableGutters maxWidth="lg">
      <WrappedBreadcrumbs
        links={[
          { children: '首頁', href: '/' },
          { children: '產品列表', href: '/products' },
          {
            children: product
              ? `編輯產品 ${productId.substring(0, 8)}`
              : '建立產品',
          },
        ]}
      />
      <ProductForm product={product} />
    </Container>
  )
}

export default Page
