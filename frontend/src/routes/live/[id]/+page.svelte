<script lang="ts">
	import { page } from "$app/stores"
	import Board from "$lib/Board.svelte"
	import { getSquare } from "$lib/board"
	import { toReversed } from "$lib/utils"
	import { Chess } from "chess.js"
	import { onMount } from "svelte"
	import { flip } from "svelte/animate"

	const game = new Chess()

	let history: string[] = []
	let board = game.board()

	let move: Exclude<Parameters<typeof game.move>[0], string> = { from: "", to: "" }

	let castleAudio: HTMLAudioElement
	let moveAudio: HTMLAudioElement
	let takeAudio: HTMLAudioElement

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
					break
				case "GAME_END":
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
	})

	const movePiece = (): boolean => {
		try {
			ws.send(`MOVE ${JSON.stringify({ ...move, gameId })}`)

			return true
		} catch (e) {
			console.log(String(e))

			return false
		} finally {
			history = [...game.history()]
		}
	}
</script>

<div class="hidden grid place-items-center fixed top-0 bottom-0 right-0 left-0 h-screen z-50">
	<div class="rounded-lg bg-neutral-50 py-5 px-6 flex flex-col items-center">
		<p class="text-3xl font-bold">Lost</p>
		<p class="text-base">by checkmate</p>
		<div class="py-8 flex flex-col items-center">
			<p class="text-4xl font-bold">1444</p>
			<p class="text-lg text-red-400 font-medium -mt-1">-24</p>
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

<div
	class="flex flex-row h-screen w-full justify-center items-center bg-neutral-950 text-white py-6 gap-x-8"
>
	<Board
		{game}
		{board}
		colorFor={myColor}
		onMove={(_move) => {
			move = _move
			movePiece()
		}}
	/>

	<div class="bg-neutral-900 rounded-xl w-1/6 p-4 flex flex-col justify-between h-96">
		<div class="flex flex-col gap-y-4">
			<button class="rounded-xl bg-neutral-800 text-center font-semibold py-4 text-2xl"
				>2 | 1</button
			>
			<button
				class="rounded-xl bg-neutral-200 text-neutral-800 text-center font-semibold py-2.5 text-2xl"
				>PLAY</button
			>
		</div>
		<div class="flex flex-row items-center justify-between pb-1">
			<div class="flex flex-row items-center gap-x-3">
				<img
					src="/popcat-with-bg.jpg"
					alt="pfp"
					class="rounded-lg w-8 h-8 object-contain"
					draggable="false"
				/>
				<p class="font-medium text-lg">
					Hikaru Nakamura &nbsp;<span class="text-neutral-400 text-xs">(6900)</span>
				</p>
			</div>
			<button type="button">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-5 h-5 stroke-neutral-400"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					/>
				</svg>
			</button>
		</div>
	</div>
</div>

By &lt;a href=&quot;//commons.wikimedia.org/wiki/User:Cburnett&quot;
title=&quot;User:Cburnett&quot;&gt;Cburnett&lt;/a&gt; - &lt;span class=&quot;int-own-work&quot;
lang=&quot;ko&quot;&gt;자작&lt;/span&gt;,<a
	href="http://creativecommons.org/licenses/by-sa/3.0/"
	title="Creative Commons Attribution-Share Alike 3.0">CC BY-SA 3.0</a
>, <a href="https://commons.wikimedia.org/w/index.php?curid=1499814">링크</a>
