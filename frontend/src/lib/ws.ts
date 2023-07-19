import { writable } from "svelte/store"

export const lobbySocketRes = writable<null | string>(null)

export const lobbySocket = new WebSocket("ws://localhost:3000/lobby")

lobbySocket.addEventListener("message", (event) => {
	lobbySocketRes.update(event.data)
})
