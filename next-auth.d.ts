import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id?: string;
      image?: string;
      accessToken?: string;
    };
  }
  interface User extends DefaultUser {
    token?: string; // authorize()가 리턴하는 raw token
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    accessToken?: string; // jwt callback에 저장할 필드
    expires?: number;
    id?: number;
    image?: string;
  }
}
