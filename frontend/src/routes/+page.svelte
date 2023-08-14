<script lang="ts">
	import { goto } from "$app/navigation"
	import Board from "$lib/components/Board.svelte"
	import PlayerCard from "$lib/components/PlayerCard.svelte"
	import { logout, user } from "$lib/stores/user"
	import { Chess } from "chess.js"
	import { onMount } from "svelte"
	import toast from "svelte-french-toast"
	import { PUBLIC_WS_URL } from "$env/static/public"

	let ws: WebSocket

	onMount(() => {
		ws = new WebSocket(`${PUBLIC_WS_URL}/lobby`)
		ws.addEventListener("message", ({ data }) => {
			const event = JSON.parse(data)

			console.log(event)
		})

		ws.addEventListener("open", () => {})
	})

	let time = 60 * 20
	let increment = 1

	const joinQueue = ({ time, increment }: { time: number; increment: number }) =>
		new Promise((resolve, reject) => {
			ws.send(
				`JOIN_GAME ${JSON.stringify({
					time,
					increment
				})}`
			)

			ws.addEventListener(
				"message",
				({ data }) => {
					const event = JSON.parse(data)

					switch (event.type) {
						case "JOIN_GAME":
							resolve("")
							setTimeout(() => {
								goto(`/live/${event.gameId}`)
							}, 800)
							break
						case "ERROR":
							reject(event.message)
							break
						default:
							break
					}
				},
				{ once: true }
			)
		})

	let game = new Chess()
	let board = game.board()

	let isGameOver = game.isGameOver()
	let gameOverReason = ""
	let gameResult = ""

	$: if (isGameOver) {
		if (game.isCheckmate()) {
			gameOverReason = "checkmate"
			gameResult = game.turn() == "w" ? "Black Won" : "White Won"
		} else if (game.isThreefoldRepetition()) {
			gameOverReason = "three fold repetition"
			gameResult = "Draw"
		} else if (game.isDraw()) {
			gameOverReason = "draw"
			gameResult = "Draw"
		} else if (game.isStalemate()) {
			gameOverReason = "stalemate"
			gameResult = "Draw"
		} else if (game.isInsufficientMaterial()) {
			gameOverReason = "insufficient material"
			gameResult = "Draw"
		}
	}
</script>

<div
	class="flex flex-row h-screen w-full justify-center items-center bg-neutral-950 text-white py-6 gap-x-8"
>
	<!-- TODO: try using min() function vh vw -->
	<Board
		allowPlayingAlone
		{game}
		{board}
		afterMove={() => {
			isGameOver = game.isGameOver()
		}}
	/>

	{#if isGameOver && gameResult}
		<div class="fixed inset-0 grid place-items-center z-50">
			<div
				class="rounded-lg text-black bg-white py-5 px-7 flex flex-col items-center justify-between"
			>
				<p class="text-3xl font-bold">{gameResult}</p>
				<p class="text-base text-neutral-700">{gameOverReason}</p>
				<div class="py-3" />
				<div class="flex flex-row items-center justify-evenly gap-x-3">
					<button
						type="button"
						on:click={() => {
							navigator.clipboard
								.writeText(game.pgn())
								.catch(() => toast.error("Couldn't copy PGN due to lack of user activation"))
								.then(() => toast.success("Copied!"))
						}}
						class="flex-shrink-0 text-sm bg-neutral-900 text-white font-semibold rounded-lg px-4 py-1.5"
						>Copy PGN</button
					>
					<button
						type="button"
						on:click={() => {
							game = new Chess()
							board = game.board()
							isGameOver = false
						}}
						class="flex-shrink-0 text-sm bg-neutral-200 text-black font-semibold rounded-lg px-4 py-1.5"
						>Reset</button
					>
				</div>
			</div>
		</div>
	{/if}

	<div class="bg-neutral-900 rounded-xl w-1/6 p-4 flex flex-col justify-between h-96">
		{#if $user && typeof $user !== "string"}
			<div class="flex flex-col gap-y-4">
				<button class="rounded-xl bg-neutral-800 text-center font-semibold py-4 text-2xl"
					>2 | 1</button
				>
				<button
					on:click={() => {
						toast.promise(joinQueue({ time, increment }), {
							error: (reason) => reason,
							success: "Game Found",
							loading: "Looking for the opponent"
						})
					}}
					class="rounded-xl bg-neutral-200 text-neutral-800 text-center font-semibold py-2.5 text-2xl"
					>PLAY</button
				>
			</div>
			<PlayerCard userId={$user.id}>
				<div class="flex flex-row items-center gap-x-3">
					<button
						type="button"
						class="rounded-full p-1 transition duration-200 hover:bg-white/10"
						on:click={() => {
							if ($user && $user !== "LOADING") goto(`/profile/${$user.id}`)
						}}
						><svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="w-5 h-5"
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
					<button
						type="button"
						class="rounded-full p-1 transition duration-200 hover:bg-white/10"
						on:click={() => {
							logout()
						}}
						><svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="w-5 h-5"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
							/>
						</svg>
					</button>
				</div>
			</PlayerCard>
		{:else if $user == "LOADING"}
			<div class="w-full h-full flex flex-col justify-center items-center gap-y-2">
				<p class="text-2xl font-semibold">Loading</p>
			</div>
		{:else}
			<div class="w-full h-full flex flex-col justify-center items-center gap-y-2">
				<p class="text-2xl font-semibold">You're not logged in</p>
				<p class="text-base text-neutral-400">You should log in to play games</p>
				<a href="/auth/login" class="bg-white text-black rounded-lg px-4 py-1 font-semibold mt-3"
					>Login</a
				>
			</div>
		{/if}
	</div>
</div>

By &lt;a href=&quot;//commons.wikimedia.org/wiki/User:Cburnett&quot;
title=&quot;User:Cburnett&quot;&gt;Cburnett&lt;/a&gt; - &lt;span class=&quot;int-own-work&quot;
lang=&quot;ko&quot;&gt;자작&lt;/span&gt;,<a
	href="http://creativecommons.org/licenses/by-sa/3.0/"
	title="Creative Commons Attribution-Share Alike 3.0">CC BY-SA 3.0</a
>, <a href="https://commons.wikimedia.org/w/index.php?curid=1499814">링크</a>
