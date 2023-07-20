<script lang="ts">
	import { getSquare } from "$lib/board"
	import { Chess, type Color, type Square } from "chess.js"
	import { onMount } from "svelte"

	// TODO: replace decidedColor with game.squareColor
	const decideColor = (x: number, y: number) => {
		if (x % 2 == 0 && y % 2 == 0) {
			return "bg-[#f0d9b5]"
		} else if (y % 2 !== 0 && x % 2 !== 0) {
			return "bg-[#f0d9b5]"
		} else {
			return "bg-[#b58863]"
		}
	}

	let draggingPiece: HTMLImageElement | null = null
	let draggingPieceCopy: HTMLImageElement | null = null

	const game = new Chess()

	let history: string[] = []
	let board = game.board()

	let move: Exclude<Parameters<typeof game.move>[0], string> = { from: "", to: "" }
	let promotionWindow: HTMLDivElement
	let isPromoting = false

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

	const onDrop = (targetSquare: HTMLDivElement) => {
		if (!draggingPiece) return
		if (!draggingPiece.parentElement) return

		const draggingPieceNotation = draggingPiece.alt.toUpperCase()

		targetSquare.classList.remove("brightness-75")

		move.from = draggingPiece.parentElement.id
		move.to = targetSquare.id

		// Handling promotions
		const [alpahbet, number] = targetSquare.id.trim().split("")
		if (draggingPieceNotation == "P" && Number(number) == 8) {
			promotionWindow.style.left = `min(${(alpahbet.charCodeAt(0) - 97) * 12.5}%, 75%)`

			isPromoting = true

			return
		}

		movePiece()
	}

	let isMounted = false

	onMount(() => {
		isMounted = true

		takeAudio = new Audio("/sounds/take.aac")
		castleAudio = new Audio("/sounds/castle.aac")
		moveAudio = new Audio("/sounds/move.aac")

		document.addEventListener("mouseup", (event) => {
			if (!draggingPiece) return

			const targetSquare = getSquare(event.target)

			if (!targetSquare) return

			onDrop(targetSquare)
			draggingPieceCopy?.remove()
			draggingPiece.parentElement?.classList.remove("brightness-75")
			draggingPiece = null
			draggingPieceCopy = null
		})
		document.addEventListener("mousemove", (event) => {
			if (!draggingPiece || !draggingPieceCopy) return

			draggingPieceCopy.style.top = `${event.clientY}px`
			draggingPieceCopy.style.left = `${event.clientX}px`
		})
	})

	const finishPromoting = (promoteTo: string) => {
		if (!isPromoting) return

		move.promotion = promoteTo.toLowerCase()

		if (movePiece()) isPromoting = false
	}

	const movePiece = (): boolean => {
		try {
			const { san } = game.move(move)

			if (san.includes("x")) playSound(takeAudio)
			else if (san.includes("O-O")) {
				playSound(moveAudio)
				setTimeout(playSound.bind(null, moveAudio), 50)
			} else playSound(moveAudio)

			board = game.board()

			return true
		} catch (e) {
			console.log(String(e))

			return false
		} finally {
			history = [...game.history()]
		}
	}

	const handleCheck = () => {
		const kingImg = document.querySelector(`[data-label="${game.turn()}_k"]`)
		const opponentKingImg = document.querySelector(
			`[data-label="${game.turn() == "w" ? "b" : "w"}_k"]`
		)
		if (!kingImg?.parentElement || !opponentKingImg?.parentElement) return
		const kingContainer = kingImg.parentElement
		const opponentKingContainer = opponentKingImg.parentElement

		if (game.isCheck()) {
			kingContainer.classList.add(
				"after:w-full",
				"after:h-full",
				"after:p-4",
				"after:bg-red-600/50",
				"after:rounded-full",
				"after:blur-2xl",
				"after:absolute"
			)

			return
		} else {
			opponentKingContainer.classList.remove(
				"after:w-full",
				"after:h-full",
				"after:p-4",
				"after:bg-red-600/50",
				"after:rounded-full",
				"after:blur-2xl",
				"after:absolute"
			)
			kingContainer.classList.remove(
				"after:w-full",
				"after:h-full",
				"after:p-4",
				"after:bg-red-600/50",
				"after:rounded-full",
				"after:blur-2xl",
				"after:absolute"
			)

			return
		}
	}

	$: if (board && isMounted) {
		handleCheck()
	}

	$: if (promotionWindow) {
		if (isPromoting) promotionWindow.style.display = "grid"
		else promotionWindow.style.display = "none"
	}

	// TODO: sepearte into several files
	// TODO: implement promotions for black
</script>

<div
	class="flex flex-row h-screen w-full justify-center items-center bg-neutral-950 text-white py-6 gap-x-8"
>
	<!-- TODO: try using min() function vh vw -->
	<div draggable="false" class="w-[83vh] h-[83vh] bg-black select-none grid grid-cols-8 relative">
		<!-- one square per 12.5% -->
		<div
			class="absolute bottom-3/4 w-1/4 left-[12.5%] top-0 bg-white rounded z-50 hidden grid-cols-2 gap-3 p-2"
			bind:this={promotionWindow}
		>
			<button
				on:click={() => {
					finishPromoting("Q")
				}}
				class="rounded transition duration-100 hover:bg-black/5"
			>
				<img
					src="/pieces/w_q.svg"
					alt="Queen"
					class="object-contain w-full cursor-pointer"
					draggable="false"
				/>
			</button>
			<button
				on:click={() => {
					finishPromoting("N")
				}}
				class="rounded transition duration-100 hover:bg-black/5"
			>
				<img
					src="/pieces/w_n.svg"
					alt="Knight"
					class="object-contain w-full cursor-pointer"
					draggable="false"
				/>
			</button>
			<button
				on:click={() => {
					finishPromoting("B")
				}}
				class="rounded transition duration-100 hover:bg-black/5"
			>
				<img
					src="/pieces/w_b.svg"
					alt="Bishop"
					class="object-contain w-full cursor-pointer"
					draggable="false"
				/>
			</button>
			<button
				on:click={() => {
					finishPromoting("R")
				}}
				class="rounded transition duration-100 hover:bg-black/5"
			>
				<img
					src="/pieces/w_r.svg"
					alt="Rook"
					class="object-contain w-full cursor-pointer"
					draggable="false"
				/>
			</button>
		</div>
		{#each board as row, i}
			{#each row as item, j}
				<div
					id={`${String.fromCharCode(j + 65).toLowerCase()}${8 - i}`}
					class={`${decideColor(
						i,
						j
					)} filter transition duration-100 aspect-square flex flex-col items-center justify-center square relative`}
					draggable="false"
					on:mouseenter={(event) => {
						if (!draggingPiece) return

						const square = getSquare(event.target)
						square?.classList.add("brightness-75")
					}}
					on:mouseleave={(event) => {
						if (!draggingPiece) return

						const square = getSquare(event.target)
						square?.classList.remove("brightness-75")
					}}
				>
					{#if item}
						<img
							src={`/pieces/${item.color}_${item.type}.svg`}
							alt={item.type}
							class="object-contain w-full cursor-pointer active:cursor-pointer select-none piece z-10"
							draggable="false"
							on:mousedown={(event) => {
								if (!(event.target instanceof HTMLImageElement)) return
								if (!event.target.classList.contains("piece")) return

								draggingPiece = event.target
								draggingPiece.parentElement?.classList.add("brightness-75")

								const rect = draggingPiece.getBoundingClientRect()
								const copied = draggingPiece.cloneNode(true)
								if (!(copied instanceof HTMLImageElement)) return

								copied.className = `fixed top-0 left-0 object-contain cursor-pointer piece-copy z-10 select-none transform-gpu -translate-x-1/2 -translate-y-1/2 pointer-events-none`
								copied.width = rect.width
								copied.height = rect.height
								copied.style.top = `${event.clientY}px`
								copied.style.left = `${event.clientX}px`

								draggingPieceCopy = copied

								document.body.appendChild(draggingPieceCopy)
							}}
							data-label={`${item.color}_${item.type}`}
						/>
					{/if}
				</div>
			{/each}
		{/each}
	</div>
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
