import { PUBLIC_GRAPHQL_URL } from "$env/static/public"
import { userSchemaWithoutGames } from "$lib/stores/user"
import { GraphQLClient, gql } from "graphql-request"
import { parse } from "valibot"

export const graphQLClient = new GraphQLClient(PUBLIC_GRAPHQL_URL, {
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
			bulletElo
			rapidElo
			blitzElo
			createdAt
			country
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

	const user = parse(userSchemaWithoutGames, data.login)

	return user
}
