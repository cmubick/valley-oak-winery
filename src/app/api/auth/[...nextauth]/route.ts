import NextAuth, { NextAuthOptions, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { dynamodb } from '@/lib/dynamodb';
import { GetCommand } from '@aws-sdk/lib-dynamodb';

// Extend the User and Session types to include 'role'
declare module 'next-auth' {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      role?: string;
      name?: string | null;
      email?: string | null;
    };
  }
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const result = await dynamodb.send(new GetCommand({
            TableName: process.env.DYNAMODB_USERS_TABLE,
            Key: { email: credentials.email },
          }));

          if (!result.Item) {
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, result.Item.password);
          
          if (!isValid) {
            return null;
          }

          return {
            id: result.Item.email,
            email: result.Item.email,
            role: result.Item.role,
          };
        } catch (error) {
          console.error('Error during authorization:', error)
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User & { role?: string } }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/admin/login',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions };
