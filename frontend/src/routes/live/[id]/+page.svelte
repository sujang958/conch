<script lang="ts">
	import { page } from "$app/stores"
	import Board from "$lib/Board.svelte"
	import PlayerCard from "$lib/PlayerCard.svelte"
	import { Chess } from "chess.js"
	import { onMount } from "svelte"

	const game = new Chess()

	let history: string[] = []
	let board = game.board()

	let move: Exclude<Parameters<typeof game.move>[0], string> = { from: "", to: "" }

	let castleAudio: HTMLAudioElement
	let moveAudio: HTMLAudioElement
	let takeAudio: HTMLAudioElement
	let endAudio: HTMLAudioElement

	const playSound = (audio: HTMLAudioElement) => {
		if (!audio.paused) {
			audio.currentTime = 0
			audio.play()
		} else {
			audio.play()
		}
	}

	const playSoundByMove = (move: string) => {
		if (move.includes("x")) playSound(takeAudio)
		else if (move.includes("O-O")) {
			playSound(moveAudio)
			setTimeout(playSound.bind(null, moveAudio), 50)
		} else playSound(moveAudio)
	}

	const gameId = $page.params.id

	let ws: WebSocket
	let myColor: "white" | "black" = "white"

	let gameEnded: boolean = false
	let endReason: string | null = null
	let newElo: { now: number; change: number } | null = null
	let won: boolean | null = null

	// TODO: add supports for spectators

	onMount(() => {
		ws = new WebSocket("ws://localhost:3000/ws/game")

		ws.addEventListener("message", async (message) => {
			const event = JSON.parse(message.data)

			console.log(event)

			switch (event.type) {
				case "BOARD":
					game.load(event.fen)
					game.loadPgn(event.pgn)

					const san = game.history().at(-1)
					playSoundByMove(san ?? "")

					if (event?.for) myColor = event.for

					board = game.board()
					history = game.history()
					break
				case "GAME_END":
					playSound(endAudio)
					won = event.you !== "DRAW" ? event.you == "WON" : null
					endReason = event.reason
					newElo = event.newElo[myColor]
					gameEnded = true
					break
				default:
					break
			}
		})

		ws.addEventListener("open", () => {
			ws.send(
				`JOIN ${JSON.stringify({
					gameId
				})}`
			)
		})

		ws.addEventListener("close", () => {
			// TODO: add an alert that shows "you're disconnected"
		})
	})

	onMount(() => {
		takeAudio = new Audio("/sounds/take.aac")
		castleAudio = new Audio("/sounds/castle.aac")
		moveAudio = new Audio("/sounds/move.aac")
		endAudio = new Audio("/sounds/end.mp3")
	})

	const movePiece = (): boolean => {
		try {
			ws.send(`MOVE ${JSON.stringify({ ...move, gameId })}`)

			return true
		} catch (e) {
			console.log(String(e))

			return false
		}
	}
</script>

{#if gameEnded && newElo}
	<div class="grid place-items-center fixed top-0 bottom-0 right-0 left-0 h-screen z-50">
		<div class="rounded-lg bg-neutral-50 py-5 px-6 flex flex-col items-center">
			<p class="text-3xl font-bold">{won != null ? (won ? "Won" : "Lost") : "Draw"}</p>
			<p class="text-base">by {endReason ?? "unknown issues"}</p>
			<div class="py-8 flex flex-col items-center">
				<p class="text-4xl font-bold">{newElo.now}</p>
				<p
					class="text-base -mt-1 {newElo.change >= 0
						? 'text-green-600 before:content-["+"]'
						: 'text-red-400'}"
				>
					{newElo.change}
				</p>
			</div>
			<div class="py-2" />
			<div class="flex flex-row items-center justify-between gap-x-2.5">
				<button
					type="button"
					class="bg-neutral-950 text-white font-semibold text-sm rounded-lg px-4 py-2"
					>New game</button
				>
				<button
					type="button"
					class="bg-neutral-200 text-black font-semibold text-sm rounded-lg px-4 py-2"
					>Go lobby</button
				>
			</div>
		</div>
	</div>
{/if}

<div
	class="flex flex-row h-screen w-full justify-center items-center bg-neutral-950 text-white py-6 gap-x-8"
>
	<Board
		{game}
		{board}
		{history}
		colorFor={myColor}
		onMove={(_move) => {
			move = _move
			movePiece()
		}}
	/>

	<div class="bg-neutral-900 rounded-xl w-1/6 p-4 flex flex-col justify-between h-96">
		<PlayerCard />
		<div class="grid grid-cols-2 gap-2">
			{#each history as move}
				<p>{move}</p>
			{/each}
		</div>
		<PlayerCard settingsButtonVisible />
	</div>
</div>

By &lt;a href=&quot;//commons.wikimedia.org/wiki/User:Cburnett&quot;
title=&quot;User:Cburnett&quot;&gt;Cburnett&lt;/a&gt; - &lt;span class=&quot;int-own-work&quot;
lang=&quot;ko&quot;&gt;자작&lt;/span&gt;,<a
	href="http://creativecommons.org/licenses/by-sa/3.0/"
	title="Creative Commons Attribution-Share Alike 3.0">CC BY-SA 3.0</a
>, <a href="https://commons.wikimedia.org/w/index.php?curid=1499814">링크</a>
