import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify"
import prisma from "../../prisma/prisma.js"
import { me } from "./queries/me.js"
import { changeBio } from "./mutations/changeBio.js"
import { changeName } from "./mutations/changeName.js"
import { login } from "./mutations/login.js"
import { logout } from "./mutations/logout.js"
import { ApolloServer } from "@apollo/server"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { join } from "path"
import {
  ApolloFastifyContextFunction,
  fastifyApolloHandler,
} from "@as-integrations/fastify"
import { GraphQLResolveInfo } from "graphql"

export type Context = {
  req: FastifyRequest
  reply: FastifyReply
}

export type Resolvers = Record<
  string,
  Record<
    string,
    (parent: any, args: any, context: Context, info: GraphQLResolveInfo) => any
  >
>

const context: ApolloFastifyContextFunction<Context> = async (req, reply) => ({
  req,
  reply,
})

// TODO: change this to auto-importing

const resolvers: Resolvers = {
  Query: {
    me,
    async user(_, { id }) {
      return JSON.parse(
        JSON.stringify(
          await prisma.user.findUnique({
            where: { id },
            include: { blackGames: true, whiteGames: true, wonGames: true },
          })
        )
      )
    },
  },
  Mutation: {
    login,
    logout,
    changeBio,
    changeName,
  },
}

const __dirname = fileURLToPath(new URL(".", import.meta.url))

const setupGraphQL = async (fastify: FastifyInstance) => {
  const apollo = new ApolloServer<Context>({
    typeDefs: readFileSync(join(__dirname, "./schema.gql"), {
      encoding: "utf-8",
    }),
    resolvers,
  })

  await apollo.start()

  fastify.route({
    url: "/graphql",
    method: ["POST", "OPTIONS"],
    handler: fastifyApolloHandler(apollo, { context }),
  })
}

export default setupGraphQL
