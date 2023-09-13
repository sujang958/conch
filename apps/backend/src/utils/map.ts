/**
 * @description This ONLY works when T is a referenced type such as objects, arrays, etc.
 */
export const getOrCreate = <T>(
  map: Map<string, T>,
  key: string,
  defaultValue: T,
): T => {
  let value = map.get(key)
  if (!value) {
    value = defaultValue
    map.set(key, value)
  }

  return value
}
