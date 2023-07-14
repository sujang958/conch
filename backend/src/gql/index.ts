import { FastifyInstance } from "fastify"
import mercurius, { IResolvers } from "mercurius"

const schema = `
  type Query {
    hello: String
  }
`

const resolvers: IResolvers = {
  Query: {
    hello: async (_, args) => {
      console.log(args)
      return "fuck you"
    },
  },
}

const setupGraphQL = (fastify: FastifyInstance) => {
  fastify.register(mercurius, {
    schema,
    resolvers,
    context: (req, res) => ({ req, res }),
    path: "/graphql",
  })
}

export default setupGraphQL
