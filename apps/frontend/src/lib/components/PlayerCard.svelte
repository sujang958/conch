<script lang="ts">
	import { gql } from "graphql-request"
	import { graphQLClient } from "../utils/graphql"
	import { number, object, string, type Output, safeParse } from "valibot"
	import { user as me } from "$lib/stores/user"
	import toast from "svelte-french-toast"

	export let userId = ""
	export let displayingElo: "blitz" | "rapid" | "bullet" | "none" = "blitz"

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

	if (
		(userId.trim().length <= 0 && $me && $me !== "LOADING") ||
		($me !== "LOADING" && userId.trim() == $me?.id)
	)
		user = $me
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
				{user.name} &nbsp; {#if displayingElo !== "none"}
					<span class="text-neutral-400 text-xs">({user[`${displayingElo}Elo`]})</span>
				{/if}
			</p>
		</div>
		<slot />
	{:else}
		<!-- TODO: add some cool loading shit -->
	{/if}
</div>
