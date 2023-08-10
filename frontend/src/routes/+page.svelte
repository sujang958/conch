<script lang="ts">
	import { goto } from "$app/navigation"
	import Board from "$lib/Board.svelte"
	import PlayerCard from "$lib/PlayerCard.svelte"
	import { auth } from "$lib/auth/firebase"
	import { logout, user } from "$lib/stores/user"
	import { graphQLClient } from "$lib/utils/graphql"
	import { Chess } from "chess.js"
	import { gql } from "graphql-request"
	import { onMount } from "svelte"
	import toast from "svelte-french-toast"

	let ws: WebSocket

	onMount(() => {
		ws = new WebSocket("ws://localhost:3000/ws/lobby") // TODO: change to env

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
