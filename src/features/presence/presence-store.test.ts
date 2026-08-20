import { usePresenceStore } from './presence-store';

describe('presence-store', () => {
  afterEach(() => {
    usePresenceStore.getState().reset();
  });

  it('has the expected initial state', () => {
    const state = usePresenceStore.getState();

    expect(state.lastCoords).toBeNull();
    expect(state.lastFixAt).toBeNull();
    expect(state.broadcasting).toBe(false);
  });

  it('setLastCoords updates lastCoords and lastFixAt', () => {
    usePresenceStore.getState().setLastCoords({ latitude: 1, longitude: 2 }, 1000);

    const state = usePresenceStore.getState();
    expect(state.lastCoords).toEqual({ latitude: 1, longitude: 2 });
    expect(state.lastFixAt).toBe(1000);
  });

  it('reset returns the store to its initial state', () => {
    usePresenceStore.getState().setLastCoords({ latitude: 1, longitude: 2 }, 1000);
    usePresenceStore.getState().setBroadcasting(true);

    usePresenceStore.getState().reset();

    const state = usePresenceStore.getState();
    expect(state.lastCoords).toBeNull();
    expect(state.lastFixAt).toBeNull();
    expect(state.broadcasting).toBe(false);
  });
});
