export type GameInfo = {
  id: BigInt
  increment: number
  /**
   * @description in seconds
   */
  time: number
}

/**
 * @description time+increment
 */
export type GameInfoString = `${number}+${number}`
