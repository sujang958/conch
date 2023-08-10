import { auth } from "$lib/auth/firebase"
import { graphQLClient } from "$lib/utils/graphql"
import { gql } from "graphql-request"
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
	name: string(),
	picture: string(),
	bio: string(),
	elo: number(),
	createdAt: string(),
	whiteGames: array(gameSchema),
	blackGames: array(gameSchema),
	wonGames: array(gameSchema)
})

export type UserType = Output<typeof userSchema>

export const user = writable<UserType | null | "LOADING">("LOADING")

export const logout = async () =>
	await Promise.allSettled([
		graphQLClient.request(gql`
			mutation Logout {
				logout
			}
		`),
		auth.signOut(),
		user.set(null),
		localStorage.removeItem("beenToChangeName")
	])
