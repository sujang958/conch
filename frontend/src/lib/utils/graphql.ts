import { GraphQLClient } from "graphql-request"

// TODO: use env var
export const graphQLClient = new GraphQLClient("http://localhost:3000/graphql", {
	method: `GET`,
	jsonSerializer: {
		parse: JSON.parse,
		stringify: JSON.stringify
	}
})
