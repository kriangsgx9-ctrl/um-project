// Server-side auth (Auth.js / NextAuth v5), replacing the prototype's client-side
// DEMO_PASSWORD check per V2 spec §12 and V1 spec §33/§41. Credentials provider +
// JWT session strategy (database sessions don't support Credentials in Auth.js) —
// no adapter needed; the user lookup goes straight through Prisma.
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // TEMPORARY diagnostic flag while chasing a production-only login failure —
  // remove once resolved (verbose auth logs shouldn't stay on long-term).
  debug: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        try {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || user.status !== "active") {
            console.log("[authorize] no active user for", email, "found:", !!user);
            return null;
          }

          const valid = await bcrypt.compare(password, user.passwordHash);
          console.log("[authorize] bcrypt.compare result for", email, ":", valid);
          if (!valid) return null;

          return { id: user.id, name: user.name, email: user.email, role: user.role };
        } catch (e) {
          console.error("[authorize] threw:", e);
          throw e;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as { role: string }).role;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.sub as string;
      }
      return session;
    },
  },
});
