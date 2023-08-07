import admin from "firebase-admin"

const app = admin.initializeApp({
  credential: admin.credential.cert(
    (await import("../../account.secret.json")).default as any
  ),
})

const auth = app.auth()

export const verifyIdToken = async (idToken: string) => {
  const decoded = await auth.verifyIdToken(idToken)

  let email = decoded.email
  email ??= (await auth.getUser(decoded.uid)).email

  if (!email) return null

  return email
}
