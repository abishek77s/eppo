import NextAuth from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // Add your providers here, e.g., GitHub, Google, etc.
    // Example:
    // CredentialsProvider({ ... })
  ],
  // Configure other NextAuth options as needed
  // secret: process.env.NEXTAUTH_SECRET, // Example: Add a secret for production
})
