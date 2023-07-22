import { Chess } from "chess.js"

export const getSquare = (element?: any) => {
	if (!element) return

	let targetSquare = element

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

	return targetSquare
}

const game = new Chess()

export type Move = Exclude<Parameters<typeof game.move>[0], string>
