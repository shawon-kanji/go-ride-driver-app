import { create } from 'zustand';

import { decodeJwtExpiryMs } from '../lib/jwt';
import { tokenStorage } from '../lib/secure-store';
import type { DriverSummary } from '../api/types';

type SessionStatus = 'unknown' | 'authenticated' | 'unauthenticated';

interface SessionState {
  status: SessionStatus;
  token: string | null;
  tokenExpiresAt: number | null;
  driver: DriverSummary | null;
  sessionExpiredReason: string | null;
  hydrate: () => Promise<void>;
  setSession: (token: string, driver: DriverSummary) => Promise<void>;
  clearSession: (reason?: string) => Promise<void>;
  consumeSessionExpiredReason: () => string | null;
}

// No zustand/persist here on purpose — the token lives in expo-secure-store only;
// this store is a synchronous in-memory mirror hydrated once at boot.
export const useSessionStore = create<SessionState>((set, get) => ({
  status: 'unknown',
  token: null,
  tokenExpiresAt: null,
  driver: null,
  sessionExpiredReason: null,

  hydrate: async () => {
    const token = await tokenStorage.get();
    if (!token) {
      set({ status: 'unauthenticated' });
      return;
    }
    const expiresAt = decodeJwtExpiryMs(token);
    if (!expiresAt || expiresAt <= Date.now()) {
      await tokenStorage.clear();
      set({ status: 'unauthenticated', token: null, tokenExpiresAt: null });
      return;
    }
    // driver snapshot is refetched by the profile query once authenticated;
    // the store only needs the token to unlock the authenticated route group.
    set({ status: 'authenticated', token, tokenExpiresAt: expiresAt });
  },

  setSession: async (token, driver) => {
    await tokenStorage.set(token);
    set({
      status: 'authenticated',
      token,
      tokenExpiresAt: decodeJwtExpiryMs(token),
      driver,
      sessionExpiredReason: null,
    });
  },

  clearSession: async (reason) => {
    await tokenStorage.clear();
    set({
      status: 'unauthenticated',
      token: null,
      tokenExpiresAt: null,
      driver: null,
      sessionExpiredReason: reason ?? get().sessionExpiredReason,
    });
  },

  consumeSessionExpiredReason: () => {
    const reason = get().sessionExpiredReason;
    if (reason) set({ sessionExpiredReason: null });
    return reason;
  },
}));
