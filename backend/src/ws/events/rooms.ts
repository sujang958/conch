import { WebSocket } from "ws"

/**
 * @description gameid:socket[]
 */
export const gameHouseholds = new Map<string, WebSocket[]>()

/**
 * @description userid:socket
 */
export const individuals = new Map<string, WebSocket>()
