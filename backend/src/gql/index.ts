import Fastify, { FastifyRequest, FastifyReply, FastifyInstance } from "fastify"
import mercurius, { IResolvers } from "mercurius"
import mercuriusCodegen, { gql } from "mercurius-codegen"

const buildContext = async (req: FastifyRequest, reply: FastifyReply) => {
  return {
    req,
    reply,
  }
}

type PromiseType<T> = T extends PromiseLike<infer U> ? U : T

declare module "mercurius" {
  interface MercuriusContext
    extends PromiseType<ReturnType<typeof buildContext>> {}
}

const schema = gql`
  type Query {
    hello(name: String!): String!
  }
`

const resolvers: IResolvers = {
  Query: {
    hello(root, { name }, ctx, info) {
      return "hello " + name
    },
  },
}

const setupGraphQL = (fastify: FastifyInstance) => {
  fastify.register(mercurius as any, {
    schema,
    resolvers,
    context: buildContext,
    path: "/graphql",
  })
}

export default setupGraphQL
