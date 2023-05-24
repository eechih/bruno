// import RefreshIcon from '@mui/icons-material/Refresh'
import { Amplify } from 'aws-amplify'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import awsConfig from '@/aws-exports'
import { getAllProducts } from '@/lib/functions'
import Box from '@/wrapped/material/Box'
import Button from '@/wrapped/material/Button'
import Container from '@/wrapped/material/Container'
import Paper from '@/wrapped/material/Paper'
import Stack from '@/wrapped/material/Stack'
import Typography from '@/wrapped/material/Typography'
import ProductDataGrid from './ProductDataGrid'

Amplify.configure(awsConfig)

async function Page() {
  const products = await getAllProducts()

  // No products? Bail...
  if (!products) {
    notFound()
  }

  return (
    <Container disableGutters maxWidth="lg">
      <Stack direction="column" py={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Stack direction="row">
            <Typography variant="h6">商品列表</Typography>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Button variant="outlined" color="inherit">
              R
            </Button>
            <Button
              variant="contained"
              LinkComponent={Link}
              href="/products/create"
            >
              建立產品
            </Button>
          </Stack>
        </Stack>
      </Stack>
      <Paper component={Box}>
        <ProductDataGrid products={products} />
      </Paper>
    </Container>
  )
}

export default Page
