import { FastifyInstance } from "fastify"
import mercurius, { IResolvers } from "mercurius"

const schema = `
  type Query {
    hello: String
  }
`

const resolvers: IResolvers = {
  Query: {
    hello: async () => "there",
  },
}

const setupGraphQL = (fastify: FastifyInstance) => {
  fastify.register(mercurius, {
    schema,
    resolvers,
    context: (req, res) => ({ req, res }),
    graphiql: process.env.NODE_ENV == "development",
    path: "/graphql",
  })
}

export default setupGraphQL
