import admin, { ServiceAccount } from "firebase-admin"
import account from "../../account.secret.json" assert { type: "json" }

const app = admin.initializeApp({
  credential: admin.credential.cert(account as ServiceAccount),
})

const auth = app.auth()

export const verifyIdToken = async (idToken: string) => {
  const decoded = await auth.verifyIdToken(idToken)

  let email = decoded.email
  email ??= (await auth.getUser(decoded.uid)).email

  if (!email) return null

  return email
}
