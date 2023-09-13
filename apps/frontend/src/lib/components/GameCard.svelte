<script lang="ts">
	import { user } from "$lib/stores/user"

	// time kind, reason, win? black, white name

	export let game: {
		timeKind: string
		reason: string
		outcome: string
		blackName: string
		whiteName: string
	}
</script>

<div class="flex flex-row items-center justify-center relative py-3 overflow-clip rounded-xl">
	<div class="absolute -top-8 -left-4 text-center flex flex-col -space-y-4">
		{#each Array.from({ length: 8 }) as _}
			<p class="text-6xl font-bold text-transparent" style="-webkit-text-stroke: 1px white;">
				{game.timeKind.toUpperCase()}
			</p>
		{/each}
	</div>
	<div class="text-center">
		<p class="text-3xl font-semibold">{game.outcome.toUpperCase()}</p>
		<p class="text-base text-neutral-400">
			by {game.reason == "DRAW" ? "MUTUAL AGREEMENT" : game.reason}
		</p>
	</div>
	<div class="absolute right-0 flex flex-col items-end gap-y-1.5">
		<p
			class="text-black bg-white rounded-xl text-sm font-medium py-0.5 px-2.5 w-min whitespace-nowrap"
		>
			{game.whiteName}
		</p>
		<p class="text-white bg-black rounded-xl text-sm font-medium py-0.5 px-2.5">{game.blackName}</p>
	</div>
</div>
