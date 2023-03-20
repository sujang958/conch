<script lang="ts">
	import { Chess, type Color, type Square } from 'chess.js';
	import { onMount } from 'svelte';

	const decideColor = (x: number, y: number) => {
		if (x % 2 == 0 && y % 2 == 0) {
			return 'bg-[#769656]';
		} else if (y % 2 !== 0 && x % 2 !== 0) {
			return 'bg-[#769656]';
		} else {
			return 'bg-[#eeeed2]';
		}
	};

	let draggingPiece: HTMLImageElement;

	const game = new Chess();

	let history: string[] = [];
	let board = game.board();

	// todo: replace decidedColor with game.squareColor
	// todo: redis for game sessions
	const onDrop = (
		event: DragEvent & {
			currentTarget: EventTarget & HTMLDivElement;
		}
	) => {
		event.preventDefault();

		if (!draggingPiece.parentElement) return;
		if (!(event.target instanceof HTMLElement)) return;
		if (!event.target.parentElement) return;
		if (!(event.target.classList.contains('square') || event.target.classList.contains('piece')))
			return;

		const square =
			event.target instanceof HTMLDivElement ? event.target : event.target.parentElement;
		let takenPiece = event.target instanceof HTMLImageElement ? event.target : null;
		const piece = draggingPiece.alt.toUpperCase();

		square.classList.remove('brightness-75');

		let move = square.id;

		const handleEnPassant = (color: Color) => {
			let toCalc = color == 'w' ? -1 : +1;

			const squarePositonFactor = square.id.split('');
			const enPassantPosition = `${squarePositonFactor[0]}${
				Number(square.id.split('')[1]) + toCalc
			}`;

			const enPassantPiece = game.get(enPassantPosition as Square);

			if (!(enPassantPiece.type == 'p' && enPassantPiece.color != color)) return;

			const enPassantPositionSquare = document.getElementById(enPassantPosition);

			if (!(enPassantPositionSquare instanceof HTMLDivElement)) return;

			const enPassantImage = enPassantPositionSquare.children.item(0);

			if (!(enPassantImage instanceof HTMLImageElement)) return;

			takenPiece = enPassantImage;
		};
		if (piece == 'P') handleEnPassant(game.turn());

		const handleCastling = (color: Color) => {
			if (!draggingPiece.parentElement) return;

			const squarePosition = square.id;
			const legalMoves = game.moves({ square: draggingPiece.parentElement.id as Square });
			if (color == 'w') {
				if (squarePosition == 'g1' && legalMoves.includes('O-O')) {
					move = 'O-O';
				} else if (squarePosition == 'c1' && legalMoves.includes('O-O-O')) {
					move = 'O-O-O';
				}
			}
		};
		if (piece == 'K') handleCastling(game.turn());

		if (takenPiece) {
			if (piece == 'P') move = draggingPiece.parentElement.id.split('')[0] + `x${move}`;
			else move = `${piece}x${move}`;
		} else if (piece != 'P' && !move.includes('O-O')) {
			move = piece + move;
		}

		const legalMoves = game.moves({ square: draggingPiece.parentElement.id as Square });

		try {
			game.move(move);

			if (!legalMoves.includes(String(game.history().at(-1)))) game.undo();

			board = game.board();
			takenPiece = null;

			console.log(game.ascii());
		} catch (e) {
			console.log(String(e));
		}

		history = [...game.history()];
		// todo: fix not updating
		// todo: add promotions
	};

	let isMounted = false;

	onMount(() => {
		isMounted = true;
	});

	const handleCheck = () => {
		const kingImg = document.querySelector(`[data-label="${game.turn()}_k"]`);
		if (!kingImg?.parentElement) return;
		const kingContainer = kingImg.parentElement;

		if (!game.isCheck())
			kingContainer.classList.remove(
				'after:w-full',
				'after:h-full',
				'after:p-4',
				'after:bg-red-600/50',
				'after:rounded-full',
				'after:blur-2xl',
				'after:absolute'
			);
		else
			kingContainer.classList.add(
				'after:w-full',
				'after:h-full',
				'after:p-4',
				'after:bg-red-600/50',
				'after:rounded-full',
				'after:blur-2xl',
				'after:absolute'
			);
	};

	$: if (board && isMounted) {
		handleCheck();
	}
</script>

<div
	class="flex flex-row h-screen w-full justify-center items-center bg-neutral-900 text-white py-6 gap-x-8"
>
	<div draggable="false" class="w-[85vh] h-[85vh] bg-black select-none grid grid-cols-8">
		{#each board as row, i}
			{#each row as item, j}
				<div
					id={`${String.fromCharCode(j + 65).toLowerCase()}${8 - i}`}
					class={`${decideColor(
						i,
						j
					)} filter transition duration-100 aspect-square flex flex-col items-center justify-center square relative`}
					draggable="false"
					on:dragover={(event) => {
						event.preventDefault();

						if (!(event.target instanceof HTMLElement)) return;

						let target = event.target;

						if (!target.parentElement) return;
						if (!(target instanceof HTMLDivElement)) target = target.parentElement;

						target.classList.add('brightness-75');
					}}
					on:dragleave={(event) => {
						event.preventDefault();

						if (!(event.target instanceof HTMLElement)) return;

						let target = event.target;

						if (!target.parentElement) return;
						if (!(target instanceof HTMLDivElement)) target = target.parentElement;

						target.classList.remove('brightness-75');
					}}
					on:drop={(event) => {
						onDrop(event);
					}}
				>
					{#if item}
						<img
							src={`/pieces/${item.color}_${item.type}.svg`}
							alt={item.type}
							class="object-contain w-full cursor-pointer active:cursor-pointer select-none piece z-10"
							draggable="true"
							data-label={`${item.color}_${item.type}`}
							on:dragstart={(event) => {
								if (event.target instanceof HTMLImageElement) draggingPiece = event.target;
							}}
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
