import { useSessionStore } from '../stores/session-store';
import { ApiError } from './http-client';
import { locationClient } from './location-client';

const originalFetch = global.fetch;

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('locationClient.updateLocation', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    useSessionStore.setState({ token: 'test-token' });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('POSTs to exactly ${EXPO_PUBLIC_LOCATION_BASE_URL}/update-location', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ accepted: true, event_id: 'e1', published_at: '2026-01-01T00:00:00Z' }),
    );

    await locationClient.updateLocation({
      driver_id: 'driver-1',
      latitude: 1,
      longitude: 2,
    });

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`${process.env.EXPO_PUBLIC_LOCATION_BASE_URL}/update-location`);
  });

  it('serialises a body containing ONLY the keys explicitly passed in', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ accepted: true, event_id: 'e1', published_at: '2026-01-01T00:00:00Z' }),
    );

    await locationClient.updateLocation({
      driver_id: 'driver-1',
      latitude: 1,
      longitude: 2,
    });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(init.body);
    expect(Object.keys(body).sort()).toEqual(['driver_id', 'latitude', 'longitude']);
  });

  it('sends an Authorization: Bearer <token> header when the session store holds a token', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ accepted: true, event_id: 'e1', published_at: '2026-01-01T00:00:00Z' }),
    );

    await locationClient.updateLocation({
      driver_id: 'driver-1',
      latitude: 1,
      longitude: 2,
    });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer test-token');
  });

  it('throws ApiError on a non-2xx response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ code: 'BAD_REQUEST', message: 'nope' }, 400),
    );

    await expect(
      locationClient.updateLocation({ driver_id: 'driver-1', latitude: 1, longitude: 2 }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
