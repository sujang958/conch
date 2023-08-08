<script lang="ts">
	import "./app.css"
	import { Toaster } from "svelte-french-toast"
	import { user } from "$lib/stores/user"
	import { loginWithIdToken } from "$lib/utils/graphql"
	import { auth } from "$lib/auth/firebase"

	auth.onIdTokenChanged(async (currentUser) => {
		const idToken = await currentUser?.getIdToken()

		if (!idToken) return ($user=null)

		const fetchedUser = await loginWithIdToken(idToken)
		$user = fetchedUser
	})

	auth.currentUser?.getIdToken().then(loginWithIdToken).then(fetchedUser => {
		if (!fetchedUser) return
		$user = fetchedUser
	})
</script>

<slot />
<Toaster />
