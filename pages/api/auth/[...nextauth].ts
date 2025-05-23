import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "../../../lib/prisma"; // Adjusted path to import shared prisma client
import bcrypt from "bcryptjs";

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" }, // Changed type to email
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Missing credentials");
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.password) {
          // Ensure user.password is not null or undefined before passing to bcrypt.compare
          throw new Error("No user found or password not set.");
        }
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid password");
        }
        // Return only necessary fields for the session/token
        return { id: user.id.toString(), email: user.email, name: user.name }; 
      },
    }),
    // ...add other providers here if any
  ],
  session: {
    strategy: "jwt", // Using JWT for session strategy
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user ID to the JWT token
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user ID to the session object
      if (session.user && token.id) {
        (session.user as any).id = token.id; // Make sure to cast session.user if needed or define type
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET, // Ensure this is set in your .env
  pages: {
    signIn: '/login', // Redirect to custom login page
    // signOut: '/auth/signout',
    // error: '/auth/error', // Error code passed in query string as ?error=
    // verifyRequest: '/auth/verify-request', // (e.g. check your email)
    // newUser: null // If set, new users will be directed here on first sign in
  }
});
