export const getProduct = /* GraphQL */ `
  query GetProduct($id: ID!) {
    getProduct(id: $id) {
      id
      name
      price
      cost
      provider
      offShelfAt
      description
    }
  }
`
export const listProducts = /* GraphQL */ `
  query ListProducts {
    listProducts {
      id
      name
      price
      cost
      provider
      offShelfAt
      description
    }
  }
`
