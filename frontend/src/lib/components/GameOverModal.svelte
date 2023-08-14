<script lang="ts">
	import { goto } from "$app/navigation"

	export let outcome: string
	export let reason: string | null = null
	export let newElo: { now: number; change: number } | null = null
</script>

<div class="grid place-items-center fixed inset-0 h-screen z-50 text-black">
	<div class="rounded-lg bg-neutral-50 py-5 px-6 flex flex-col items-center">
		<p class="text-3xl font-bold">{outcome}</p>
		<p class="text-base">by {reason ?? "unknown reasons"}</p>
		{#if newElo}
			<div class="py-8 flex flex-col items-center">
				<p class="text-4xl font-bold">{newElo.now}</p>
				<p
					class="text-base -mt-1 {newElo.change >= 0
						? 'text-green-600 before:content-["+"]'
						: 'text-red-400'}"
				>
					{newElo.change}
				</p>
			</div>
		{/if}
		<div class="py-2" />
		<div class="flex flex-row items-center justify-between gap-x-2.5">
			<slot />
			<button
				type="button"
				on:click={() => goto("/")}
				class="bg-neutral-200 text-black font-semibold text-sm rounded-lg px-4 py-2"
				>Go lobby</button
			>
		</div>
	</div>
</div>
