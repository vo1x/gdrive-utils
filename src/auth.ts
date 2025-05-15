import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { refreshAccessToken } from "@/lib/drive";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/user";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET!,
      authorization: {
        url: "https://accounts.google.com/o/oauth2/auth",
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at * 1000;
      }

      const tenMinutes = 10 * 60 * 1000;
      if (Date.now() > token.expiresAt - tenMinutes) {
        const newTokens = await refreshAccessToken(token.refreshToken);
        if (newTokens) {
          token.accessToken = newTokens.accessToken;
          token.expiresAt = newTokens.expiresAt;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.accessToken = token.accessToken;
      session.user.expiresAt = token.expiresAt;

      return session;
    },

    async signIn({ user, account }) {
      if (account.provider === "google") {
        const { name, email } = user;
        try {
          await connectMongoDB();
          let userExists = await User.findOne({ email });

          if (!userExists) {
            userExists = await User.create({
              name,
              email,
              refreshToken: account?.refresh_token,
              accessToken: account?.access_token,
              expiresAt: account?.expires_at * 1000,
            });
          } else {
            userExists.refreshToken = account?.refresh_token;
            userExists.accessToken = account?.access_token;
            userExists.expiresAt = account?.expires_at * 1000;
            await userExists.save();
          }

          return true;
        } catch (error) {
          console.log("Error in signIn:", error);
          return false;
        }
      }
      return true;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
});
