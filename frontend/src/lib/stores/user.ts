import { writable } from "svelte/store"

type Game = {
	id: string
	pgn: string
	reason: string
	time: number
	increment: number
	endedAt: string
	createdAt: string

	whiteId: string
	blackId: string
	winnerId: string
}

export const user = writable<{
	id: string
	name: string
	picture: string
	bio: string
	elo: Number
	createdAt: string
	whiteGames: Game[]
	blackGames: Game[]
	wonGames: Game[]
} | null>(null)
