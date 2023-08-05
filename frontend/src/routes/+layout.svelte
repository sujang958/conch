<script>
	import "./app.css"
	import { Toaster } from "svelte-french-toast"
	import { gql } from "graphql-request"
	import { user } from "$lib/stores/user"
	import { graphQLClient } from "$lib/utils/graphql"

	const userQuery = gql`
		{
			me {
				id
				name
				picture
				bio
				elo
				createdAt
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
				}
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
				}
			}
		}
	`

	graphQLClient
		.request(userQuery)
		.then((data) => {
			$user = data.me
		})
		.catch((err) => {
			console.log(err)

			$user = null
		})
</script>

<slot />
<Toaster />
