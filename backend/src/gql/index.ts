import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify"
import mercurius, { IResolvers } from "mercurius"
import prisma from "../../prisma/prisma.js"
import { sign, verify } from "../auth/jwt.js"
import { parseCookie } from "../utils/cookie.js"
import { getEmailByCode } from "../auth/oauth.js"
import { schema } from "./schema.js"

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

// const userAction = async (ctx: mercurius.MercuriusContext) => {
//   const cookie = parseCookie(ctx.req.headers.cookie)
//   if (!cookie.token) return null

//   return await verify(cookie.token)
// }

const userAction = (callback: (user: { id: string }, arg: any) => any) => {
  return async (_: any, arg: any, ctx: mercurius.MercuriusContext) => {
    const cookie = parseCookie(ctx.req.headers.cookie)
    if (!cookie.token) return null

    const user = await verify(cookie.token)
    if (!user) return null

    return await callback(user, arg)
  }
}

const resolvers: IResolvers = {
  Query: {
    async me(_, __, ctx) {
      const token = parseCookie(ctx.req.headers.cookie ?? "").token
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
        JSON.stringify(
          await prisma.user.findUnique({
            where: { id },
            include: { blackGames: true, whiteGames: true, wonGames: true },
          }),
        ),
      )
    },
  },
  Mutation: {
    async login(_, { code }, ctx) {
      if (!code) return
      const email = await getEmailByCode(code)

      if (!email) return false

      const user = await prisma.user.upsert({
        where: {
          email,
        },
        update: {},
        create: {
          email,
        },
      })

      const token = await sign({ id: user.id })

      ctx.req.headers["set-cookie"] = [`token=${token}; HttpOnly`]

      return true
    },
    changeBio: userAction(async (user, { bio }) => {
      const updatedUser = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          bio,
        },
        include: {
          blackGames: true,
          whiteGames: true,
          wonGames: true,
        },
      })

      return updatedUser
    }),
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
