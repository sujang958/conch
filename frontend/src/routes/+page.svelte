<script lang="ts">
	import { Chess, type Color, type Square } from "chess.js"
	import { onMount } from "svelte"

	const decideColor = (x: number, y: number) => {
		if (x % 2 == 0 && y % 2 == 0) {
			return "bg-[#769656]"
		} else if (y % 2 !== 0 && x % 2 !== 0) {
			return "bg-[#769656]"
		} else {
			return "bg-[#eeeed2]"
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

	// TODO: replace decidedColor with game.squareColor
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
			let targetSquare = event.target

			if (!draggingPiece) return
			if (!(targetSquare instanceof HTMLElement)) return
			if (!targetSquare.classList.contains("square") && !targetSquare.classList.contains("piece"))
				return
			if (
				targetSquare instanceof HTMLImageElement &&
				targetSquare.parentElement &&
				targetSquare.parentElement instanceof HTMLDivElement
			)
				targetSquare = targetSquare.parentElement
			if (!(targetSquare instanceof HTMLDivElement)) return

			onDrop(targetSquare)
			draggingPieceCopy?.remove()
			draggingPiece.parentElement?.classList.remove("brightness-75")
		})
		document.addEventListener("mousemove", (event) => {
			if (!draggingPiece || !draggingPieceCopy) return

			draggingPieceCopy.style.top = `${event.clientY}px`
			draggingPieceCopy.style.left = `${event.clientX}px`
		})
	})

	const finishPromoting = (promoteTo: string) => {
		if (!isPromoting) return
		if (!draggingPiece?.parentElement) return

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
		if (isPromoting) {
			promotionWindow.style.display = "grid"
		} else {
			promotionWindow.style.display = "none"
		}
	}

	// TODO: sepearte into several files
	// TODO: implement promotions for black
</script>

<div
	class="flex flex-row h-screen w-full justify-center items-center bg-neutral-900 text-white py-6 gap-x-8"
>
	<!-- TODO: try using min() function vh vw -->
	<div draggable="false" class="w-[85vh] h-[85vh] bg-black select-none grid grid-cols-8 relative">
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
	<div class="bg-neutral-800 rounded-lg w-1/6 p-4">
		<p
			class="text-2xl font-bold before:rounded-lg before:content-['GM'] before:bg-red-600 before:text-xl before:px-1 before:mr-2"
		>
			Hikaru Nakamura <span class="font-normal text-xl text-gray-300">(3200)</span>
		</p>
		<div class="py-3" />
		<div class="grid grid-cols-2 gap-y-2 h-64 overflow-auto">
			{#each history as move}
				<div class="w-1/2"><p class="text-lg">{move}</p></div>
			{/each}
		</div>
		<div class="py-3" />
		<p
			class="text-2xl font-bold before:rounded-lg before:content-['GM'] before:bg-red-600 before:text-xl before:px-1 before:mr-2"
		>
			Magnus Carlsen <span class="font-normal text-xl text-gray-300">(3200)</span>
		</p>
	</div>
</div>

By &lt;a href=&quot;//commons.wikimedia.org/wiki/User:Cburnett&quot;
title=&quot;User:Cburnett&quot;&gt;Cburnett&lt;/a&gt; - &lt;span class=&quot;int-own-work&quot;
lang=&quot;ko&quot;&gt;자작&lt;/span&gt;,<a
	href="http://creativecommons.org/licenses/by-sa/3.0/"
	title="Creative Commons Attribution-Share Alike 3.0">CC BY-SA 3.0</a
>, <a href="https://commons.wikimedia.org/w/index.php?curid=1499814">링크</a>
