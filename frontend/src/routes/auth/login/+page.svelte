<script lang="ts">
	import { goto } from "$app/navigation"
	import { auth, githubProvider, googleProvider } from "$lib/auth/firebase"
	import { user } from "$lib/stores/user"
	import { signInWithPopup } from "firebase/auth"
	import toast from "svelte-french-toast"

	const checkUser = () => {
		if (!$user || $user == "LOADING") return window.setTimeout(checkUser, 100)

		if ($user.name == "unnamed" && !localStorage.getItem("beenToChangeName"))
			return goto("/auth/changeName")

		localStorage.setItem("beenToChangeName", "1")

		goto("/")
	}

	const login = async (method: "GOOGLE" | "GITHUB") => {
		const provider = method == "GOOGLE" ? googleProvider : githubProvider

		await signInWithPopup(auth, provider)

		checkUser()
	}
</script>

<section class="w-full h-screen flex flex-row items-stretch">
	<section class="flex-1 bg-white">
		<img src="/images/bg.jpg" alt="Magnus meme" class="object-contain w-full h-full" />
	</section>
	<section class="flex-1 grid place-items-center">
		<div class="w-72 flex flex-col items-center justify-center gap-y-8">
			<section class="w-full text-center">
				<p class="text-2xl font-semibold">Login to Conch</p>
				<p class="text-sm text-neutral-400 mt-2.5">
					I was too lazy to create a login with email lol
				</p>
			</section>
			<div class="border-t border-neutral-800 -mt-2 pt-6 w-full flex flex-col gap-y-4">
				<button
					on:click={() =>
						toast.promise(login("GOOGLE"), {
							error: (err) => err,
							loading: "Handling login",
							success: "Successfully logged in!"
						})}
					type="button"
					class="bg-white border border-neutral-900 text-black rounded-lg w-full py-2 font-semibold text-sm flex flex-row items-center justify-center gap-x-2"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="705.6"
						height="720"
						viewBox="0 0 186.69 190.5"
						class="h-[1.1rem] w-[1.1rem]"
					>
						<path
							fill="#4285f4"
							d="M-1089.333-687.239v36.888h51.262c-2.251 11.863-9.006 21.908-19.137 28.662l30.913 23.986c18.011-16.625 28.402-41.044 28.402-70.052 0-6.754-.606-13.249-1.732-19.483z"
							transform="translate(1184.583 765.171)"
						/>
						<path
							fill="#34a853"
							d="M-1142.714-651.791l-6.972 5.337-24.679 19.223c15.673 31.086 47.796 52.561 85.03 52.561 25.717 0 47.278-8.486 63.038-23.033l-30.913-23.986c-8.486 5.715-19.31 9.179-32.125 9.179-24.765 0-45.806-16.712-53.34-39.226z"
							transform="translate(1184.583 765.171)"
						/>
						<path
							fill="#fbbc05"
							d="M-1174.365-712.61c-6.494 12.815-10.217 27.276-10.217 42.689s3.723 29.874 10.217 42.689c0 .086 31.693-24.592 31.693-24.592-1.905-5.715-3.031-11.776-3.031-18.098s1.126-12.383 3.031-18.098z"
							transform="translate(1184.583 765.171)"
						/>
						<path
							fill="#ea4335"
							d="M-1089.333-727.244c14.028 0 26.497 4.849 36.455 14.201l27.276-27.276c-16.539-15.413-38.013-24.852-63.731-24.852-37.234 0-69.359 21.388-85.032 52.561l31.692 24.592c7.533-22.514 28.575-39.226 53.34-39.226z"
							transform="translate(1184.583 765.171)"
						/>
					</svg> Continue with Google</button
				>
				<button
					type="button"
					on:click={login.bind(null, "GITHUB")}
					class="bg-neutral-900 text-white rounded-lg w-full py-2 font-semibold text-sm flex flex-row items-center justify-center gap-x-2"
					><svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						class="invert h-[1.1rem] w-[1.1rem]"
						><path
							d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
						/></svg
					> Continue with Github</button
				>
			</div>
		</div>
	</section>
</section>
