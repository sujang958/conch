<script lang="ts">
	import { getSquare, type Move } from "$lib/board"
	import { Chess, type Color, type Square } from "chess.js"
	import { onMount } from "svelte"
	import { toReversed } from "../utils/toReversed"
	import gsap, { Linear } from "gsap"

	export let onMove: ((move: Move) => any) | null = null
	export let afterMove: (...args: any[]) => any = () => {}
	export let game: Chess = new Chess()
	export let board = game.board()
	export let history: string[] = []
	export let colorFor: "white" | "black" = "white"
	export let allowPlayingAlone: boolean = false

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

	let clickedPiece: HTMLImageElement | null = null

	let move: Move = { from: "", to: "" }
	let promotionWindow: HTMLDivElement
	let isPromoting = false

	let castleAudio: HTMLAudioElement
	let moveAudio: HTMLAudioElement
	let takeAudio: HTMLAudioElement

	const playAudio = (audio: HTMLAudioElement) => {
		if (!audio.paused) {
			audio.currentTime = 0
			audio.play()
		} else {
			audio.play()
		}
	}

	const playAudioByMove = (move: string) => {
		if (move.includes("x")) playAudio(takeAudio)
		else if (move.includes("O-O")) {
			playAudio(moveAudio)
			setTimeout(playAudio.bind(null, moveAudio), 50)
		} else playAudio(moveAudio)
	}

	const onDrop = (targetSquare: HTMLDivElement) => {
		if (!draggingPiece) return
		if (!draggingPiece.parentElement) return

		targetSquare.classList.remove("brightness-75")

		if (
			!allowPlayingAlone &&
			draggingPiece.getAttribute("data-label")?.split("_")[0] !== colorFor.at(0)
		)
			return

		const draggingPieceNotation = draggingPiece.alt.toUpperCase()

		move.from = draggingPiece.parentElement.id
		move.to = targetSquare.id

		// Handling promotions
		const [alpahbet, number] = targetSquare.id.trim().split("")
		const rank = Number(number)
		if (
			draggingPieceNotation == "P" &&
			((game.turn() == "w" && rank == 8) || (game.turn() == "b" && rank == 1))
		) {
			const squaresFromBorderToTargetWindow = alpahbet.charCodeAt(0) - 97

			// TODO: add promotions for black

			if (rank == 8) promotionWindow.style.left = `min(${squaresFromBorderToTargetWindow}%, 75%)`
			else promotionWindow.style.right = `max(${squaresFromBorderToTargetWindow}%, 12.5%)`

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

	const finishPromoting = async (promoteTo: string) => {
		if (!isPromoting) return

		move.promotion = promoteTo.toLowerCase()

		if (await movePiece()) isPromoting = false
	}

	const animate = async () => {
		if (!draggingPiece?.parentElement?.id) return

		const toSquare = document.getElementById(move.to)
		if (!toSquare) return

		const copiedPiece = draggingPiece.cloneNode(true) as HTMLImageElement

		toSquare.appendChild(copiedPiece)

		// TODO: fix overmoving a lil bit when capturing

		const yAmountToMove = copiedPiece.y - draggingPiece.y
		const xAmountToMove = copiedPiece.x - draggingPiece.x

		copiedPiece.remove()

		// TODO: add options to disable this
		await gsap.to(draggingPiece, {
			x: xAmountToMove,
			y: yAmountToMove,
			duration: 0.1
		})
	}

	const movePiece = async (): Promise<boolean> => {
		try {
			const legalSquares = game
				.moves({})
				.map((move) =>
					(typeof move == "string" ? move : move.after).replace(/[^a-z0-9]/g, "").replace(/x/g, "")
				)

			if (legalSquares.includes(move.to)) await animate()

			if (onMove) {
				Promise.resolve(onMove(move)).then(() => {
					board = game.board()
				})
				return true
			}
			const { san } = game.move(move)

			playAudioByMove(san)

			board = game.board()

			clickedPiece = null

			return true
		} catch (e) {
			console.log(String(e))

			return false
		} finally {
			history = [...game.history()]
			move.promotion = undefined

			if (move.from !== move.to) clickedPiece = null

			afterMove()
		}
	}

	// TODO: sepearte into several file

	const getSquareNotation = ({
		x,
		y,
		colorFor
	}: {
		x: number
		y: number
		colorFor: "white" | "black"
	}) =>
		`${String.fromCharCode(colorFor == "white" ? x + 65 : 72 - x).toLowerCase()}${
			colorFor == "white" ? 8 - y : y + 1
		}` as Square

	const isLegalSquare = (fromSquare: any, toSquare: Square) =>
		game
			.moves({ square: fromSquare, verbose: true })
			.map((move) => move.to)
			.includes(toSquare)

	$: if (promotionWindow) {
		if (isPromoting) promotionWindow.style.display = "grid"
		else promotionWindow.style.display = "none"
	}
</script>

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
				src="/pieces/{colorFor.charAt(0)}_q.svg"
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
				src="/pieces/{colorFor.charAt(0)}_n.svg"
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
				src="/pieces/{colorFor.charAt(0)}_b.svg"
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
				src="/pieces/{colorFor.charAt(0)}_r.svg"
				alt="Rook"
				class="object-contain w-full cursor-pointer"
				draggable="false"
			/>
		</button>
	</div>
	{#each colorFor == "white" ? board : toReversed(board) as row, i}
		{#each colorFor == "white" ? row : toReversed(row) as item, j}
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
			<div
				tabindex="0"
				id={getSquareNotation({ x: j, y: i, colorFor })}
				class={`${decideColor(
					i,
					j
				)} filter transition duration-100 aspect-square flex flex-col items-center justify-center square relative ${
					clickedPiece &&
					isLegalSquare(clickedPiece.parentElement?.id, getSquareNotation({ x: j, y: i, colorFor }))
						? "after:rounded-full after:absolute after:m-3 after:bg-neutral-500/50 after:w-7 after:h-7 after:xl:w-8 after:xl:h-8 after:z-50"
						: ""
				}`}
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
				on:mousedown={(event) => {
					const square = getSquare(event.target)
					if (!square) return

					const piece = square?.firstElementChild

					// Click-to-move supports
					if (
						clickedPiece &&
						isLegalSquare(
							clickedPiece.parentElement?.id,
							getSquareNotation({ x: j, y: i, colorFor })
						)
					) {
						draggingPiece = clickedPiece
						onDrop(square)

						return
					}

					if (piece && piece instanceof HTMLImageElement) clickedPiece = piece
				}}
				on:blur={(event) => {
					if (!clickedPiece) return

					const square = getSquare(event.target)
					if (clickedPiece.parentElement?.id !== square?.id) return

					clickedPiece = null
				}}
			>
				{#if item}
					<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
					<img
						src={`/pieces/${item.color}_${item.type}.svg`}
						alt={item.type}
						class="object-contain w-full cursor-pointer active:cursor-pointer select-none piece z-10"
						draggable="false"
						on:mousedown={(event) => {
							if (!(event.target instanceof HTMLImageElement)) return
							if (!event.target.classList.contains("piece")) return

							if (draggingPieceCopy) {
								draggingPieceCopy.remove()
								draggingPiece = null
							}

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
