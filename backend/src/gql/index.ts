import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify"
import { me } from "./queries/me.js"
import { changeBio } from "./mutations/changeBio.js"
import { changeName } from "./mutations/changeName.js"
import { login } from "./mutations/login.js"
import { logout } from "./mutations/logout.js"
import { ApolloServer } from "@apollo/server"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { join } from "path"
import fastifyApollo, {
  ApolloFastifyContextFunction,
  fastifyApolloHandler,
} from "@as-integrations/fastify"
import { GraphQLResolveInfo } from "graphql"
import { games } from "./queries/games.js"
import { user } from "./queries/user.js"
import { Resolvers } from "../__generated__/resolvers-types.js"

export type Context = {
  req: FastifyRequest
  reply: FastifyReply
}

const context: ApolloFastifyContextFunction<Context> = async (req, reply) => ({
  req,
  reply,
})

// TODO: change this to auto-importing

const resolvers: Resolvers = {
  Query: {
    me,
    user,
    games,
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

  await fastify.register(fastifyApollo(apollo), { context })
}

export default setupGraphQL
