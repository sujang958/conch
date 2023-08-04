<script>
	import "./app.css"
	import { Toaster } from "svelte-french-toast"
	import { GraphQLClient, gql, request } from "graphql-request"
	import { user } from "$lib/stores/user"

	// TODO: use env var
	const graphQLClient = new GraphQLClient("http://localhost:3000/graphql", {
		method: `GET`,
		jsonSerializer: {
			parse: JSON.parse,
			stringify: JSON.stringify
		}
	})

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

	graphQLClient.request(userQuery).then((data) => {
		$user = data.me
	})
</script>

<slot />
<Toaster />
