import { useSessionStore } from '../stores/session-store';
import { driverTripsClient } from './driver-trips-client';

const originalFetch = global.fetch;

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('driverTripsClient', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    useSessionStore.setState({ token: 'test-token' });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("getEarnings('today') GETs ${EXPO_PUBLIC_DRIVER_TRIPS_BASE_URL}/earnings?period=today", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ period: 'today', total_earnings: 10, trip_count: 1 }),
    );

    await driverTripsClient.getEarnings('today');

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`${process.env.EXPO_PUBLIC_DRIVER_TRIPS_BASE_URL}/earnings?period=today`);
    expect(init.method).toBe('GET');
  });

  it("getOnlineTime('today') GETs ${EXPO_PUBLIC_DRIVER_TRIPS_BASE_URL}/online-time?period=today", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ period: 'today', total_minutes: 30 }),
    );

    await driverTripsClient.getOnlineTime('today');

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(
      `${process.env.EXPO_PUBLIC_DRIVER_TRIPS_BASE_URL}/online-time?period=today`,
    );
  });

  it('sends the bearer token on getEarnings', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ period: 'today', total_earnings: 10, trip_count: 1 }),
    );

    await driverTripsClient.getEarnings('today');

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer test-token');
  });

  it('sends the bearer token on getOnlineTime', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ period: 'today', total_minutes: 30 }),
    );

    await driverTripsClient.getOnlineTime('today');

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer test-token');
  });

  it('a 401 from driver-request-handler clears the session, same as go-ride-backend', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ code: 'UNAUTHORIZED', message: 'expired' }, 401),
    );
    const clearSpy = jest.spyOn(useSessionStore.getState(), 'clearSession');

    await expect(driverTripsClient.getEarnings('today')).rejects.toThrow();

    expect(clearSpy).toHaveBeenCalledWith('Your session ended. Please log in again.');
  });
});
