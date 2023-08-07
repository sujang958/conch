import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify"
import mercurius, { IResolvers } from "mercurius"
import prisma from "../../prisma/prisma.js"
import { sign, verify } from "../auth/jwt.js"
import { schema } from "./schema.js"
import { nanoid } from "nanoid"
import { verifyIdToken } from "../auth/firebase.js"
import { me } from "./queries/me.js"
import { changeBio } from "./mutations/changeBio.js"
import { changeName } from "./mutations/changeName.js"

const buildContext = async (req: FastifyRequest, reply: FastifyReply) => ({
  req,
  reply,
})

type PromiseType<T> = T extends PromiseLike<infer U> ? U : T

declare module "mercurius" {
  interface MercuriusContext
    extends PromiseType<ReturnType<typeof buildContext>> {}
}

// TODO: change this to auto-importing

const resolvers: IResolvers = {
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
    async login(_, { idToken }, ctx) {
      if (!idToken) return
      const email = await verifyIdToken(idToken)
      if (!email) return false

      const user = await prisma.user.upsert({
        where: {
          email,
        },
        update: {},
        create: {
          email,
          name: nanoid(),
        },
      })

      const token = await sign({ id: user.id })

      ctx.req.headers["set-cookie"] = [`token=${token}; HttpOnly`]

      return true
    },
    changeBio,
    changeName,
  },
}

const setupGraphQL = (fastify: FastifyInstance) => {
  fastify.register(mercurius as any, {
    schema,
    resolvers,
    context: buildContext,
    path: "/graphql",
    graphiql: process.env.NODE_ENV === "development",
  })
}

export default setupGraphQL
