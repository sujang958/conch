<script lang="ts">
	import { page } from "$app/stores"
	import GameCard from "$lib/components/GameCard.svelte"
	import { graphQLClient } from "$lib/utils/graphql"
	import { gql } from "graphql-request"
	import { parse } from "graphql"
	import type { TypedDocumentNode } from "@graphql-typed-document-node/core"
	import { array, merge, object, pick, type Output, string, nullish } from "valibot"
	import { gameSchema, userSchema } from "$lib/stores/user"

	const nameObject = object({
		name: string()
	})

	const gameWithOnlyUsersName = merge([
		gameSchema,
		object({
			white: nameObject,
			black: nameObject,
			winner: nullish(nameObject)
		})
	])

	const userQueryResSchema = pick(
		merge([
			userSchema,
			object({
				whiteGames: array(gameWithOnlyUsersName),
				blackGames: array(gameWithOnlyUsersName),
				wonGames: array(gameWithOnlyUsersName)
			})
		]),
		[
			"name",
			"picture",
			"createdAt",
			"bulletElo",
			"rapidElo",
			"blitzElo",
			"bio",
			"wonGames",
			"blackGames",
			"whiteGames"
		]
	)

	type UserQueryRes = Output<typeof userQueryResSchema>

	const userQuery: TypedDocumentNode<{ user: UserQueryRes }, { userId: string }> = parse(gql`
		query User($userId: String!) {
			user(id: $userId) {
				name
				picture
				createdAt
				bulletElo
				rapidElo
				blitzElo
				bio
				wonGames {
					id
					pgn
					reason
					time
					increment
					endedAt
					createdAt

					whiteId
					blackId
					winnerId

					white {
						name
					}
					black {
						name
					}
					winner {
						name
					}
				}
				whiteGames {
					id
					pgn
					reason
					time
					increment
					endedAt
					createdAt

					whiteId
					blackId
					winnerId

					white {
						name
					}
					black {
						name
					}
					winner {
						name
					}
				}
				blackGames {
					id
					pgn
					reason
					time
					increment
					endedAt
					createdAt

					whiteId
					blackId
					winnerId

					white {
						name
					}
					black {
						name
					}
					winner {
						name
					}
				}
			}
		}
	`)

	const fetchGames = async (userId: string) => {
		const res = await graphQLClient.request(userQuery, { userId })

		console.log(res.user)

		return userQueryResSchema.parse(res.user)
	}

	let user: Promise<UserQueryRes> = fetchGames($page.params.id)
</script>

{#await user}
	<div class="h-screen w-full grid place-content-center">
		<p class="text-3xl font-semibold">Loading</p>
	</div>
{:then user}
	<main class="grid place-items-center w-full">
		<section class="max-w-4xl w-full p-24 flex flex-col">
			<a href="/" class="-ml-2 hover:bg-white/5 w-min rounded-full p-1"
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
						d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
					/>
				</svg>
			</a>
			<div class="py-10" />
			<img src="/popcat-with-bg.jpg" alt="pfp" class="rounded-2xl object-contain w-36 h-36" />
			<div class="py-4" />
			<div class="flex flex-row items-stretch justify-between">
				<section class="flex flex-col justify-between">
					<p class="text-3xl font-semibold">{user.name} <span class="text-xl">🇰🇷</span></p>
					<p class="text-sm mt-3 text-neutral-400">{new Date(user.createdAt).toDateString()}</p>
					<p class="text-xl mt-6">{user.bio}</p>
				</section>
				<section class="flex flex-col items-end text-right justify-between">
					<p class="text-2xl font-semibold">ELO</p>
					<p class="text-lg font-semibold mt-4">
						{user.rapidElo} <span class="text-neutral-400">Rapid</span>
					</p>
					<p class="text-lg font-semibold">
						{user.blitzElo} <span class=" text-neutral-400">Blitz</span>
					</p>
					<p class="text-lg font-semibold">
						{user.bulletElo} <span class=" text-neutral-400">Bullet</span>
					</p>
				</section>
			</div>
			<div class="py-16 relative flex flex-col gap-y-4">
				<header
					class="sticky top-0 w-full py-4 bg-neutral-950 flex flex-row items-center gap-x-2.5 z-10"
				>
					<button
						type="button"
						class="rounded-xl font-medium text-sm px-3 py-0.5 bg-black text-white border border-neutral-700"
						>All</button
					>
					<button
						type="button"
						class="rounded-2xl font-medium text-sm px-3 py-0.5 bg-white text-black">Won</button
					>
					<button
						type="button"
						class="rounded-2xl font-medium text-sm px-3 py-0.5 bg-white text-black">White</button
					>
					<button
						type="button"
						class="rounded-2xl font-medium text-sm px-3 py-0.5 bg-white text-black">Black</button
					>
				</header>
				<div />
				<GameCard />
				<GameCard />
				<GameCard />
				<GameCard />
				<GameCard />
			</div>
		</section>
	</main>
{/await}
