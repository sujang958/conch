export const toReversed = (arr: any[]) => {
	const copied = structuredClone(arr)
	copied.reverse()
	return copied
}
