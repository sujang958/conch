import { auth } from "$lib/auth/firebase"
import { graphQLClient } from "$lib/utils/graphql"
import { gql } from "graphql-request"
import { writable } from "svelte/store"
import { array, nullish, number, object, string, type Output, omit, merge } from "valibot"

export const gameSchemaWithoutUsers = object({
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
	whiteGames: array(gameSchemaWithoutUsers),
	blackGames: array(gameSchemaWithoutUsers),
	wonGames: array(gameSchemaWithoutUsers)
})

export type UserType = Output<typeof userSchema>

export const userSchemaWithoutGames = omit(userSchema, ["wonGames", "blackGames", "whiteGames"])

export type UserWithoutGamesType = Output<typeof userSchemaWithoutGames>

export const gameSchema = merge([
	gameSchemaWithoutUsers,
	object({
		white: userSchemaWithoutGames,
		black: userSchemaWithoutGames,
		winner: nullish(userSchemaWithoutGames)
	})
])

export const user = writable<UserWithoutGamesType | null | "LOADING">("LOADING")

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
