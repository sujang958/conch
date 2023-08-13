<script lang="ts">
	import { page } from "$app/stores"
	import GameCard from "$lib/components/GameCard.svelte"

	console.log($page.params.id)
</script>

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
				<p class="text-3xl font-semibold">sujang958 <span class="text-xl">🇰🇷</span></p>
				<p class="text-sm mt-3 text-neutral-400">Joined on Mar 24 2023</p>
				<p class="text-xl mt-6">im a noob</p>
			</section>
			<section class="flex flex-col items-end text-right justify-between">
				<p class="text-2xl font-semibold">ELO</p>
				<p class="text-lg font-semibold mt-4">
					1325 <span class="text-neutral-400">Current</span>
				</p>
				<p class="text-lg font-semibold">1522 <span class=" text-neutral-400">Peak</span></p>
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
