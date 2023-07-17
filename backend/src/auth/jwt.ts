import { config } from "dotenv"
import jwt from "jsonwebtoken"
import { TokenPayload } from "../types/token.js"

config()

const JWT_SECRET = process.env.JWT_SECRET

export const sign = async (payload: TokenPayload) => {
  if (!JWT_SECRET) throw new Error("Can't load theJWT secret")

  return jwt.sign(JSON.stringify(payload), JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "9999 years",
  })
}

export const verify = async (token: string) => {
  if (!JWT_SECRET) throw new Error("Can't load theJWT secret")

  const parsed = JSON.parse(jwt.verify(token, JWT_SECRET).toString())
  const typeChecked = TokenPayload.safeParse(parsed)

  if (!typeChecked.success) return false

  return typeChecked.data
}
