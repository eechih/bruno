'use client'

import { withAuthenticator } from '@aws-amplify/ui-react'
import Container from '@mui/material/Container'
import { Amplify } from 'aws-amplify'
import { useEffect, useState } from 'react'

import awsConfig from '@/aws-exports'
import WrappedBreadcrumbs from '@/components/shared/WrappedBreadcrumbs'
import { getProduct } from '@/lib/functions'
import { Product } from '@/lib/types'
import ProductForm from '../ProductForm'

Amplify.configure(awsConfig)

type PageProps = {
  params: { productId: string }
}

function Page({ params: { productId } }: PageProps) {
  const [product, setProduct] = useState<Product>()

  useEffect(() => {
    getProduct(productId).then(product => {
      setProduct(product)
    })
  }, [productId, setProduct])

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

export default withAuthenticator(Page)
