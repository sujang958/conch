export const propertyToNumber = (obj: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(obj).map(([name, value]) => [name, Number(value)]),
  )
