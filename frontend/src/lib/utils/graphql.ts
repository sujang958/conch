import { userSchema } from "$lib/stores/user"
import { GraphQLClient, gql } from "graphql-request"
import { parse } from "valibot"

// TODO: use env var
export const graphQLClient = new GraphQLClient("http://localhost:3000/graphql", {
	// method: ``,
	jsonSerializer: {
		parse: JSON.parse,
		stringify: JSON.stringify
	},
	credentials: "include"
})

const loginMutation = gql`
	mutation Login($idToken: String!) {
		login(idToken: $idToken) {
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

export const loginWithIdToken = async (idToken: string) => {
	const data = await graphQLClient.request(loginMutation, {
		idToken
	})

	if (typeof data !== "object") return null
	if (!data) return null
	if (!("login" in data)) return null
	if (!data.login) return null

	const user = parse(userSchema, data.login)

	return user
}
