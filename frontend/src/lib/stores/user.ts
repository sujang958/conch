import { writable } from "svelte/store"
import { array, nullish, number, object, string, type Output } from "valibot"

export const gameSchema = object({
	id: string(),
	pgn: string(),
	reason: string(),
	time: number(),
	increment: number(),
	endedAt: string(),
	createdAt: string(),

	whiteId: string(),
	blackId: string(),
	winnerId: nullish(string())
})

export const userSchema = object({
	id: string(),
	name: nullish(string()),
	picture: string(),
	bio: string(),
	elo: number(),
	createdAt: string(),
	whiteGames: array(gameSchema),
	blackGames: array(gameSchema),
	wonGames: array(gameSchema)
})

export type UserType = Output<typeof userSchema>

export const user = writable<UserType | null>(null)