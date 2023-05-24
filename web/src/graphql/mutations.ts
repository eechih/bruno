export const createProduct = /* GraphQL */ `
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      name
      description
      price
      cost
      provider
      offShelfAt
    }
  }
`
export const updateProduct = /* GraphQL */ `
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      id
      name
      description
      price
      cost
      optionGrid
      images
      provider
      offShelfAt
      publishAt
      createdAt
      updatedAt
      owner
    }
  }
`
