<script lang="ts">
	import { gql } from "graphql-request"
	import { graphQLClient } from "../utils/graphql"
	import { number, object, parse, string, type Output } from "valibot"

	export let userId = ""

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

	graphQLClient.request(userQuery, { id: userId }).then((res) => {
		if (!res) return
		if (typeof res !== "object") return
		if (!("user" in res)) return // TODO: show some error typa shits

		user = parse(partialUserSchema, res.user)
	})
</script>

{#if user}
	<div class="flex flex-row items-center justify-between pb-1">
		<div class="flex flex-row items-center gap-x-3">
			<img
				src={user.picture ?? "/popcat-with-bg.jpg"}
				alt="pfp"
				class="rounded-lg w-8 h-8 object-contain"
				draggable="false"
			/>
			<p class="font-medium text-lg">
				{user.name} &nbsp;<span class="text-neutral-400 text-xs"
					>({Math.max(user.bulletElo, user.blitzElo, user.rapidElo)})</span
				>
			</p>
		</div>
		<slot />
	</div>
{/if}
