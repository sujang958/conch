import { PUBLIC_WS_URL } from "$env/static/public"

export const joinNewGame = ({
	time,
	increment
}: {
	time: number
	increment: number
}): Promise<string> =>
	new Promise((resolve, reject) => {
		const ws = new WebSocket(`${PUBLIC_WS_URL}/lobby`)

		ws.addEventListener("message", (res) => {
			const event = JSON.parse(String(res.data))

			if (event.type !== "JOIN_GAME") return

			resolve(String(event.gameId))
		})

		ws.addEventListener("open", () => [ws.send(`JOIN_GAME ${JSON.stringify({ time, increment })}`)])

		ws.addEventListener("close", () => reject("Disconnected from the server"))
	})
