import NextAuth from 'next-auth';
// import { decode as jwtDecode, encode as jwtEncode } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { signinApi, signoutApi } from '@/entities/auth/api/services';
import { TEST_TEAM_ID } from '@/shared/api/httpClient';
import { API_CONFIG, API_ENDPOINTS } from '@/shared/config';

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

        const res = await signinApi(credentials);

        console.log({ credentials, res });
        return {
          id: credentials.email,
          email: credentials.email,
          token: res.token,
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  // jwt: {
  //   // 이 두 콜백을 추가하면, NextAuth가 “자체 생성”이 아니라 백엔드 JWT를 그대로 사용합니다.
  //   async encode({ token: nextAuthToken }) {
  //     // nextAuthToken.accessToken 에 백엔드 JWT가 들어있습니다.
  //     return nextAuthToken!.accessToken!;
  //   },
  //   async decode({ token }) {
  //     // token 인자로 받은 건 “백엔드 JWT 문자열”입니다.
  //     const decoded = await jwtDecode({ token, secret: process.env.NEXTAUTH_SECRET! });
  //     console.log('decoded', decoded);
  //     return decoded as any;
  //   },
  // },

  events: {
    async signOut(message) {
      console.log('User signed out:', message);
      await signoutApi();
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      // user.token(=signinApi에서 받은 토큰)을 jwt token.accessToken에 저장
      console.log({ token, user });
      if (user?.token) {
        token.accessToken = user.token;

        const userInfoResponse = await fetch(
          API_CONFIG.BASE_URL(TEST_TEAM_ID) + API_ENDPOINTS.AUTH.USER,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          },
        );

        const userInfo = await userInfoResponse.json();
        console.log('USER INFO', userInfo);
        token.name = userInfo.name;
        token.id = userInfo.id;
        token.image = userInfo.image;
        token.companyName = userInfo.companyName;
      }

      return token;
    },
    async session({ session, token }) {
      // 클라이언트 useSession() 시 session.user.accessToken으로 꺼낼 수 있음
      session.user.accessToken = token.accessToken;
      console.log('SESSION - token exp', token.exp);
      // if (token.exp) {
      //   session.expires = new Date(token.exp * 1000).toISOString();
      // }

      console.log('session.expires', token, token.exp, session.expires);

      session.user.id = token.id?.toString();
      session.user.accessToken = token.accessToken;
      session.user.name = token.name;
      session.user.image = token.image;

      return session;
    },
  },
});

export { handler as GET, handler as POST };
