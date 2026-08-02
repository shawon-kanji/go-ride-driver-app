import { apiRequest } from './http-client';
import type { Driver, LoginPayload, LoginResult, SignupPayload } from './types';

export const authClient = {
  // 201 {driver} — no token. Callers must chain into login() to authenticate.
  signup: (payload: SignupPayload) =>
    apiRequest<{ driver: Driver }>('/driver/auth/signup', {
      method: 'POST',
      body: payload,
      skipAuth: true,
    }),

  login: (payload: LoginPayload) =>
    apiRequest<LoginResult>('/driver/auth/login', {
      method: 'POST',
      body: payload,
      skipAuth: true,
    }),
};
