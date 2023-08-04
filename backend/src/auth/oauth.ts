import { createOAuthAppAuth } from "@octokit/auth-oauth-app"
import _vegot from "vegot"

const { default: vegot } = _vegot

if (!process.env.GH_ID || !process.env.GH_SECRET) process.exit()

export const auth = createOAuthAppAuth({
  clientType: "oauth-app",
  clientId: process.env.GH_ID,
  clientSecret: process.env.GH_SECRET,
})

export const getEmailByCode = async (code: string) => {
  const authentication = await auth({
    type: "oauth-user",
    code,
  })
  const res = await vegot("https://api.github.com/user/emails", {
    headers: {
      accept: "application/vnd.github+json",
      Authorization: `${authentication.tokenType} ${authentication.token}`,
    },
  })
  if (res.statusCode ?? 500 >= 400) return null

  const data = JSON.parse(res.data)
  if (!Array.isArray(data)) return null
  if (data.length < 1) return null

  return data[0].email
}
