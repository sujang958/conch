import Fastify, { FastifyRequest, FastifyReply, FastifyInstance } from "fastify"
import mercurius, { IResolvers } from "mercurius"
import mercuriusCodegen, { gql } from "mercurius-codegen"
import prisma from "../../prisma/prisma.js"
import { verify } from "../auth/jwt.js"

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
  type User {
    id: String!
    name: String
    picture: String!
    bio: String!
    elo: Int!
    createdAt: String!
    whiteGames: [GameWithoutPlayers]!
    blackGames: [GameWithoutPlayers]!
    wonGames: [GameWithoutPlayers]!
  }

  type UserWithoutGames {
    id: String!
    name: String
    picture: String!
    bio: String!
    elo: Int!
    createdAt: String!
  }

  type Game {
    id: String!
    pgn: String!
    reason: String!
    time: Int!
    increment: Int!
    endedAt: Int!
    createdAt: String!

    white: UserWithoutGames!
    black: UserWithoutGames!
    whiteId: String!
    blackId: String!

    winner: UserWithoutGames
    winnerId: String
  }

  type GameWithoutPlayers {
    id: String!
    pgn: String!
    reason: String!
    time: Int!
    increment: Int!
    endedAt: String!
    createdAt: String!

    whiteId: String!
    blackId: String!
    winnerId: String
  }

  type Query {
    user(id: String!): User
    me: User
  }
`

const resolvers: IResolvers = {
  Query: {
    async me(_, __, ctx) {
      const token = ctx.req.headers.token
      if (!token) return null

      const user = await verify(token.toString())
      if (!user) return null

      const fetchedUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          blackGames: true,
          whiteGames: true,
          wonGames: true,
        },
      })

      if (!fetchedUser) return

      return JSON.parse(JSON.stringify(fetchedUser))
    },
    async user(_, { id }) {
      return JSON.parse(
        JSON.stringify(await prisma.user.findUnique({ where: { id } })),
      )
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
