import { create } from 'zustand';

import type { LatLng } from '../../lib/geo';

export interface PresenceState {
  /** Latest fix from the broadcaster's watcher — updated on EVERY fix, including
   *  the ones the throttle decides not to POST. The map wants smoothness; the
   *  backend wants a bounded request rate. Those are different concerns. */
  lastCoords: LatLng | null;
  lastFixAt: number | null;
  broadcasting: boolean;
  setLastCoords: (coords: LatLng, at: number) => void;
  setBroadcasting: (value: boolean) => void;
  reset: () => void;
}

const INITIAL = { lastCoords: null, lastFixAt: null, broadcasting: false } as const;

export const usePresenceStore = create<PresenceState>((set) => ({
  ...INITIAL,
  setLastCoords: (coords, at) => set({ lastCoords: coords, lastFixAt: at }),
  setBroadcasting: (value) => set({ broadcasting: value }),
  reset: () => set({ ...INITIAL }),
}));
