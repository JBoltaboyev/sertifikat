import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Tizimga kirish",
      credentials: {
        username: { label: "Login", type: "text" },
        password: { label: "Parol", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        try {
          const rawUsername = credentials.username.trim();
          const lowerUsername = rawUsername.toLowerCase();

          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { username: rawUsername },
                { username: lowerUsername }
              ]
            }
          });

          if (!user) return null;

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) return null;

          return {
            id: user.id,
            name: user.fullName || user.username,
            role: user.role,
            facultyId: user.facultyId
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.facultyId = (user as any).facultyId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).facultyId = token.facultyId;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "sertifikat-pro-max-secret-key-1234",
};
