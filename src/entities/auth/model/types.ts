export type SignupPayload = {
  email: string;
  password: string;
  name: string;
  companyName: string;
};

export type SignupResponse = {
  status: number;
  message: string;
};
export type SigninPayload = {
  email: string;
  password: string;
};

export type SigninResponse = {
  token: string;
  ok: boolean;
};
