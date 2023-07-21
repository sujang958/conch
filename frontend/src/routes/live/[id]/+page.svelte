<script lang="ts">
	import { page } from "$app/stores"
	import { onMount } from "svelte"

	const gameId = $page.params.id

	onMount(() => {
		const ws = new WebSocket("ws://localhost:3000/ws/game")

		ws.addEventListener("message", async (message) => {
			console.log(message.data)
		})

		ws.addEventListener("open", () => {
			console.log(ws.readyState)
			ws.send(
				`JOIN ${JSON.stringify({
					gameId
				})}`
			)
		})
	})
</script>
