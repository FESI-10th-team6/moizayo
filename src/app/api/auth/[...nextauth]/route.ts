import NextAuth from 'next-auth';
// import { decode as jwtDecode, encode as jwtEncode } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { signinApi, signoutApi } from '@/entities/auth/api/services';
import { API_CONFIG, API_ENDPOINTS } from '@/shared/config';
import * as Sentry from '@sentry/nextjs';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: '이메일', type: 'text' },
        password: { label: '비밀번호', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        try {
          const res = await signinApi(credentials);

          if (!res?.token) {
            console.error('Login failed: No token received');
            return null;
          }

          return {
            id: credentials.email,
            email: credentials.email,
            token: res.token,
          };
        } catch (error) {
          console.error('Login error:', error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  events: {
    async signOut(message) {
      if (process.env.NODE_ENV === 'development') {
        console.log('User signed out:', message);
      }

      // 센트리에서 사용자 정보 제거
      Sentry.setUser(null);
      Sentry.setTag('user.company', null);

      await signoutApi();
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      // user.token(=signinApi에서 받은 토큰)을 jwt token.accessToken에 저장
      if (process.env.NODE_ENV === 'development') {
        console.log({ token, user });
      }
      if (user?.token) {
        token.accessToken = user.token;

        try {
          const userInfoResponse = await fetch(API_CONFIG.BASE_URL() + API_ENDPOINTS.AUTH.USER, {
            headers: { Authorization: `Bearer ${user.token}` },
          });

          if (!userInfoResponse.ok) {
            console.error('Failed to fetch user info:', userInfoResponse.status);
            return token;
          }

          const userInfo = await userInfoResponse.json();
          if (process.env.NODE_ENV === 'development') {
            console.log('USER INFO', userInfo);
          }
          token.name = userInfo.name;
          token.id = userInfo.id;
          token.image = userInfo.image;
          token.companyName = userInfo.companyName;
        } catch (error) {
          console.error('Error fetching user info:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      // 클라이언트 useSession() 시 session.user.accessToken으로 꺼낼 수 있음
      session.user.id = token.id?.toString();
      session.user.accessToken = token.accessToken;
      session.user.name = token.name;
      session.user.image = token.image;
      session.user.companyName = token.companyName;

      // 센트리에 사용자 정보 설정 (개인정보 보호)
      if (token.id) {
        Sentry.setUser({
          id: token.id.toString(),
        });
        if (token.companyName) {
          Sentry.setTag('user.company', token.companyName as string);
        }
      } else {
        // 로그아웃 상태일 때 사용자 정보 제거
        Sentry.setUser(null);
        Sentry.setTag('user.company', null);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('SESSION - token exp', token.exp);
        console.log('session.expires', token, token.exp, session.expires);
      }

      return session;
    },
  },
});

export { handler as GET, handler as POST };
