export function request(ctx) {
  return {}
}

export function response(ctx) {
  let identityValue = ctx.identity.claims['username']
  if (identityValue === null) {
    identityValue = ctx.identity.claims['cognito:username']
  }

  let items = []
  ctx.result.items.forEach(function (item) {
    if (item['owner'] === identityValue) {
      items.push(item)
    }
  })
  ctx.result.items = items
  return ctx.result
}
