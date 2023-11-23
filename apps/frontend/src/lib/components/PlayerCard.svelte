<script lang="ts">
	import { gql } from "graphql-request"
	import { graphQLClient } from "../utils/graphql"
	import { number, object, string, type Output, safeParse } from "valibot"
	import { user as me } from "$lib/stores/user"
	import toast from "svelte-french-toast"

	export let userId = ""
	export let displayingElo: "blitz" | "rapid" | "bullet" = "blitz"

	const partialUserSchema = object({
		name: string(),
		picture: string(),
		bulletElo: number(),
		rapidElo: number(),
		blitzElo: number()
	})

	let user: Output<typeof partialUserSchema>

	const userQuery = gql`
		query User($id: String!) {
			user(id: $id) {
				name
				bulletElo
				rapidElo
				blitzElo
				picture
			}
		}
	`

	if (userId.trim().length <= 0 && $me && $me !== "LOADING") user = $me
	else
		graphQLClient.request(userQuery, { id: userId }).then((res) => {
			if (!res) return
			if (typeof res !== "object") return
			if (!("user" in res)) return // TODO: show some error typa shits

			const parsedRes = safeParse(partialUserSchema, res.user)
			if (!parsedRes.success) return toast.error("Error while fetching the user")

			user = parsedRes.data
		})
</script>

<div class="flex flex-row items-center justify-between pb-1">
	{#if user}
		<div class="flex flex-row items-center gap-x-3">
			<img
				src={user.picture ?? "/popcat-with-bg.jpg"}
				alt="pfp"
				class="rounded-lg w-8 h-8 object-contain"
				draggable="false"
			/>
			<p class="font-medium text-lg">
				{user.name} &nbsp;<span class="text-neutral-400 text-xs"
					>({user[`${displayingElo}Elo`]})</span
				>
			</p>
		</div>
		<slot />
	{:else}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="w-3 h-3 animate-spin stroke-neutral-300 justify-self-center self-center"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
			/>
		</svg>
	{/if}
</div>
