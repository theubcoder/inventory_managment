import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

const ADMIN_EMAIL = "thenaeemullahpk@gmail.com"
const ADMIN_PASSWORD_HASH = "$2b$10$YdXhn8YdjyQV2dxxoV/ntegJNzR5TNK.F.5AZntg8MlM60QIfknDa"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        if (credentials.email !== ADMIN_EMAIL) {
          return null
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          ADMIN_PASSWORD_HASH
        )

        if (!isValidPassword) {
          return null
        }

        return {
          id: "1",
          email: ADMIN_EMAIL,
          name: "Admin",
          role: "admin"
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.email = token.email
        session.user.role = token.role
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
})