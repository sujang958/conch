<script lang="ts">
	import { goto } from "$app/navigation"
	import { auth } from "$lib/auth/firebase"
	import { user, userSchema, userSchemaWithoutGames, type UserType } from "$lib/stores/user"
	import { graphQLClient } from "$lib/utils/graphql"
	import type { TypedDocumentNode } from "@graphql-typed-document-node/core"
	import { parse, type TypedQueryDocumentNode } from "graphql"
	import { gql } from "graphql-request"
	import { onMount } from "svelte"
	import toast from "svelte-french-toast"
	import { safeParse } from "valibot"

	let changedName = ""

	// 정보) 브라우저 URL로 접속하면 $user가 LOADING이여서 안됨 (대부분)

	onMount(() => {
		if (!auth.currentUser) goto("/auth/login")
		if (!$user) return goto("/auth/login")
		if ($user == "LOADING") return goto("/auth/login")

		changedName = $user.name
	})

	const changeNameMutation: TypedDocumentNode<{ changeName: UserType | null }, { name: string }> =
		parse(gql`
			mutation changeName($name: String!) {
				changeName(name: $name) {
					id
					name
					picture
					bio
					bulletElo
					rapidElo
					blitzElo
					createdAt
					country
				}
			}
		`)

	const changeName = async (name: string) => {
		const res = await graphQLClient.request(changeNameMutation, { name })
		const parsed = safeParse(userSchemaWithoutGames, res.changeName)

		if (!parsed.success) throw new Error("An error occured")

		$user = parsed.data

		goto("/")
	}
</script>

{#if $user && $user !== "LOADING" && auth.currentUser}
	<section class="place-items-center grid h-screen">
		<div class="flex flex-col items-center text-center">
			<p class="text-2xl font-semibold">
				Hello, {auth.currentUser?.displayName ?? "Welcome to Conch"}
			</p>
			<p class="mt-2 text-sm text-neutral-400" style="text-wrap: balance;">
				Enter a name to use. It doesn't have to be unique.
			</p>
			<div class="py-3" />
			<label class="text-left w-full">
				<p class="text-base font-medium">Name</p>
				<input
					type="text"
					class="mt-0.5 w-full bg-neutral-950 border-neutral-800 rounded-lg px-2 py-1"
					placeholder="unnamed"
					bind:value={changedName}
				/>
			</label>
			<div class="py-4" />
			<div class="flex flex-row w-full items-center gap-x-3 justify-between">
				<button
					type="button"
					on:click={() =>
						toast.promise(changeName(changedName), {
							error: (e) => e,
							loading: "Loading",
							success: "Successfully changed your name"
						})}
					class="bg-white text-black font-medium rounded-lg py-1.5 w-full text-sm">Change</button
				>
				<button
					type="button"
					on:click={() => goto("/")}
					class="bg-neutral-900 text-white font-medium rounded-lg py-1.5 w-full text-sm"
					>Do it later</button
				>
			</div>
		</div>
	</section>
{/if}
