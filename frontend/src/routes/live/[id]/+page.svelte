<script lang="ts">
	import { goto } from "$app/navigation"
	import { page } from "$app/stores"
	import { PUBLIC_WS_URL } from "$env/static/public"
	import { getTimeKind } from "$lib/board"
	import Board from "$lib/components/Board.svelte"
	import GameOverModal from "$lib/components/GameOverModal.svelte"
	import PlayerCard from "$lib/components/PlayerCard.svelte"
	import { user } from "$lib/stores/user"
	import { joinNewGame } from "$lib/ws"
	import { Chess } from "chess.js"
	import { onDestroy, onMount } from "svelte"
	import toast from "svelte-french-toast"

	let confirmWindowShown = false
	let confirmMessage = "Are you sure?"
	let confirmDescription = "U sure?"
	let confirmFunction = () => {}
	let notConfirmFunction = () => {}

	const game = new Chess()

	let history: string[] = []
	let board = game.board()
	let boardInitialized = false

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
	let isInGamePlayer = false

	let gameEnded: boolean = false
	let endReason: string | null = null
	let newElo: { now: number; change: number } | null = null
	let won: boolean | null = null
	/**
	 * in ms
	 */
	let time: { white: number; black: number } = { white: 0, black: 0 }
	/**
	 * in ms
	 */
	let lastMovedTime = -1
	let players = { black: "", white: "" }

	let info: Record<string, number> = {}

	const onWSOpen = () => {
		ws.send(
			`JOIN ${JSON.stringify({
				gameId
			})}`
		)
	}

	const onWSClose = () => {
		toast.error("Disconnected from the server!")
	}

	const onWSMessage = async (message: MessageEvent<any>) => {
		const event = JSON.parse(message.data)

		console.log(event)

		switch (event.type) {
			case "NOT_FOUND":
				toast.error("Game not found", { duration: 10_000 })
				break
			case "BOARD":
				game.load(event.fen)

				info = event.info
				players = { ...event.players }
				time = { white: event.time.white, black: event.time.black }
				lastMovedTime = event.time.lastMovedTime

				const turnFullname = game.turn() == "w" ? "white" : "black"
				time = { ...time, [turnFullname]: time[turnFullname] - (Date.now() - lastMovedTime) }

				if (!boardInitialized) boardInitialized = true

				const san = game.history().at(-1)
				playSoundByMove(san ?? "")

				if (event?.for) {
					myColor = event.for
					isInGamePlayer = true
				}

				board = game.board()
				history = game.history()
				break
			case "GAME_END":
				playSound(endAudio)
				if (event?.you) won = event.you !== "DRAW" ? event.you == "WON" : null
				endReason = event.reason
				newElo = event.newElo[myColor]
				gameEnded = true
				break
			case "DRAW_REQUESTED":
				confirmMessage = "Your opponent requested a draw"
				confirmDescription = "Do you accept it?"
				confirmFunction = () => {
					ws.send(`DRAW_RESPONSE ${JSON.stringify({ gameId, accepted: true })}`)
				}
				notConfirmFunction = () => {
					ws.send(`DRAW_RESPONSE ${JSON.stringify({ gameId, accepted: false })}`)
				}
				confirmWindowShown = true
				break
			default:
				break
		}
	}

	onMount(() => {
		ws = new WebSocket("ws://localhost:3000/ws/game")

		ws.addEventListener("message", onWSMessage)
		ws.addEventListener("open", onWSOpen)
		ws.addEventListener("close", onWSClose)
	})

	let timer: NodeJS.Timer

	onMount(() => {
		takeAudio = new Audio("/sounds/take.aac")
		castleAudio = new Audio("/sounds/castle.aac")
		moveAudio = new Audio("/sounds/move.aac")
		endAudio = new Audio("/sounds/end.mp3")

		let before = Date.now()

		timer = setInterval(async () => {
			if (game.isGameOver()) return
			if (gameEnded) return
			if (!boardInitialized) return

			const turnFullname = game.turn() == "w" ? "white" : "black"
			const targetTime = time[turnFullname]

			if (targetTime > 0) {
				const now = Date.now()

				time = { ...time, [turnFullname]: targetTime - (now - before) }
				before = now
			}

			if (turnFullname !== myColor && time[turnFullname] <= 0)
				ws.send(`CLAIM_TIMEOUT ${JSON.stringify({ gameId })}`)
		}, 10)
	})

	onDestroy(() => {
		if (ws) {
			ws.removeEventListener("message", onWSMessage)
			ws.removeEventListener("open", onWSOpen)
			ws.removeEventListener("close", onWSClose)
		}
		clearInterval(timer)
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

	const convertToMMSS = (ms: number) => {
		const seconds = ms / 1000
		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = seconds % 60

		const formattedMinutes = String(minutes).padStart(2, "0")
		const formattedSeconds = String(
			minutes <= 0 && remainingSeconds < 10
				? remainingSeconds.toFixed(2)
				: Math.round(remainingSeconds)
		).padStart(2, "0")

		return `${formattedMinutes}:${
			Number(formattedSeconds) < 10 && Number(formattedSeconds) > 0
				? `0${formattedSeconds}`
				: formattedSeconds
		}`
	}

	const lookForNewGame = async ({ time, increment }: { time: number; increment: number }) => {
		const gameId = await joinNewGame({
			time,
			increment
		})

		location.replace(`/live/${gameId}`)

		// TODO: change this to goto and initialize all state to get a better UX
	}
</script>

{#if gameEnded}
	<GameOverModal
		outcome={won != null ? (won ? "Won" : "Lost") : "Draw"}
		reason={endReason}
		{newElo}
	>
		{#if isInGamePlayer}
			<button
				type="button"
				on:click={() =>
					toast.promise(lookForNewGame({ time: info.time, increment: info.increment }), {
						error: (e) => e,
						loading: "Looking for the opponent",
						success: "Match Found"
					})}
				class="bg-neutral-950 text-white font-semibold text-sm rounded-lg px-4 py-2"
				>New game</button
			>
		{/if}
	</GameOverModal>
{/if}

<main
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

	<div class="flex flex-col w-1/6 gap-y-4">
		{#if players[myColor] && "time" in info}
			<section class="bg-neutral-900 rounded-xl p-4 flex flex-col justify-between h-96">
				<PlayerCard
					userId={players[myColor == "white" ? "black" : "white"]}
					displayingElo={getTimeKind(info.time)}
				>
					<div class="rounded-lg py-1 px-2.5 font-bold bg-white text-black">
						{convertToMMSS(time[myColor == "white" ? "black" : "white"])}
					</div>
				</PlayerCard>

				<div class="grid grid-cols-2 gap-2 overflow-auto py-4">
					{#each history as move}
						<p>{move}</p>
					{/each}
				</div>

				<PlayerCard userId={players[myColor]} displayingElo={getTimeKind(info.time)}>
					<div
						class="rounded-lg py-1 px-2.5 font-bold bg-white text-black {game.turn() ==
						(myColor == 'white' ? 'w' : 'b')
							? 'bg-black text-neutral-700'
							: ''}"
					>
						{convertToMMSS(time[myColor])}
					</div>
				</PlayerCard>
			</section>
		{/if}

		{#if isInGamePlayer}
			<section
				class="flex flex-row items-center justify-evenly rounded-lg bg-neutral-900 relative p-2 gap-x-3"
			>
				<button
					type="button"
					class="font-semibold rounded-lg flex-1 p-2 bg-neutral-200 text-black text-base"
					on:click={() => {
						confirmMessage = "Request a draw?"
						confirmDescription = "You won't be able to redo this action"
						confirmFunction = () => {
							ws.send(`DRAW_REQUEST ${JSON.stringify({ gameId })}`)
							toast.success("Requested a draw")
						}
						confirmWindowShown = true
					}}>Draw</button
				>
				<button
					type="button"
					class="font-semibold rounded-lg flex-1 p-2 bg-neutral-200 text-black text-base"
					on:click={() => {
						confirmMessage = "Are you surrendering?"
						confirmDescription = "This action cannot be redone."
						confirmFunction = () => {
							ws.send(`RESIGN ${JSON.stringify({ gameId })}`)
						}
						confirmWindowShown = true
					}}>Resign</button
				>
			</section>

			<section
				class="rounded-lg bg-neutral-900 transition duration-100 {confirmWindowShown
					? 'opacity-100'
					: 'opacity-0'} focus:opacity-100 text-center p-4 flex flex-col gap-y-4"
			>
				<p class="font-semibold text-2xl">{confirmMessage}</p>
				<p class="text-base text-neutral-400">{confirmDescription}</p>
				<div class="flex flex-row items-center justify-evenly mt-3 gap-x-2">
					<button
						type="button"
						on:click={() => {
							confirmFunction()
							confirmWindowShown = false
							confirmFunction = () => {}
							notConfirmFunction = () => {}
						}}
						class="rounded-lg flex-1 p-1.5 text-base text-white bg-red-500 font-medium">Yes</button
					>
					<button
						type="button"
						on:click={() => {
							notConfirmFunction()
							confirmWindowShown = false
							confirmFunction = () => {}
							notConfirmFunction = () => {}
						}}
						class="rounded-lg flex-1 p-1.5 text-base text-black bg-neutral-50 font-medium"
						>No</button
					>
				</div>
			</section>
		{/if}
	</div>
</main>

By &lt;a href=&quot;//commons.wikimedia.org/wiki/User:Cburnett&quot;
title=&quot;User:Cburnett&quot;&gt;Cburnett&lt;/a&gt; - &lt;span class=&quot;int-own-work&quot;
lang=&quot;ko&quot;&gt;자작&lt;/span&gt;,<a
	href="http://creativecommons.org/licenses/by-sa/3.0/"
	title="Creative Commons Attribution-Share Alike 3.0">CC BY-SA 3.0</a
>, <a href="https://commons.wikimedia.org/w/index.php?curid=1499814">링크</a>
