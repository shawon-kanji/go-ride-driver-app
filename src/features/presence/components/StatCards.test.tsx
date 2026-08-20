import { render, screen } from '@testing-library/react-native';

import { StatCards } from './StatCards';
import { useTodayEarningsQuery, useTodayOnlineTimeQuery } from '../api';

jest.mock('lucide-react-native', () => require('../../../test-utils/expo-mocks').createLucideMock());
jest.mock('../api', () => ({ useTodayEarningsQuery: jest.fn(), useTodayOnlineTimeQuery: jest.fn() }));

const mockUseTodayEarningsQuery = useTodayEarningsQuery as jest.Mock;
const mockUseTodayOnlineTimeQuery = useTodayOnlineTimeQuery as jest.Mock;

function mockQueries({
  earnings,
  onlineTime,
}: {
  earnings?: { total_earnings: number; trip_count: number; currency_code?: string };
  onlineTime?: { total_minutes: number };
} = {}) {
  mockUseTodayEarningsQuery.mockReturnValue({ data: earnings });
  mockUseTodayOnlineTimeQuery.mockReturnValue({ data: onlineTime });
}

describe('StatCards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Test 7: renders RM 148.20 and 6 trips', async () => {
    mockQueries({ earnings: { total_earnings: 148.2, trip_count: 6 }, onlineTime: { total_minutes: 0 } });
    await render(<StatCards />);

    expect(screen.getByText('RM 148.20')).toBeTruthy();
    expect(screen.getByText('6 trips')).toBeTruthy();
  });

  it('Test 8: zero earnings renders RM 0.00 and 0 trips', async () => {
    mockQueries({ earnings: { total_earnings: 0, trip_count: 0 }, onlineTime: { total_minutes: 0 } });
    await render(<StatCards />);

    expect(screen.getByText('RM 0.00')).toBeTruthy();
    expect(screen.getByText('0 trips')).toBeTruthy();
  });

  it('Test 9: singular trip count renders "1 trip"', async () => {
    mockQueries({ earnings: { total_earnings: 20, trip_count: 1 }, onlineTime: { total_minutes: 0 } });
    await render(<StatCards />);

    expect(screen.getByText('1 trip')).toBeTruthy();
  });

  it('Test 10: currency_code overrides the RM default', async () => {
    mockQueries({
      earnings: { total_earnings: 148.2, trip_count: 6, currency_code: 'MYR' },
      onlineTime: { total_minutes: 0 },
    });
    await render(<StatCards />);

    expect(screen.getByText('MYR 148.20')).toBeTruthy();
  });

  it('Test 11: 252 minutes renders 4h 12m and "Today so far"', async () => {
    mockQueries({ earnings: { total_earnings: 0, trip_count: 0 }, onlineTime: { total_minutes: 252 } });
    await render(<StatCards />);

    expect(screen.getByText('4h 12m')).toBeTruthy();
    expect(screen.getByText('Today so far')).toBeTruthy();
  });

  it('Test 12: zero minutes renders 0m and "Not online yet"', async () => {
    mockQueries({ earnings: { total_earnings: 0, trip_count: 0 }, onlineTime: { total_minutes: 0 } });
    await render(<StatCards />);

    expect(screen.getByText('0m')).toBeTruthy();
    expect(screen.getByText('Not online yet')).toBeTruthy();
  });

  it('Test 13: 45 minutes renders 45m with no 0h prefix', async () => {
    mockQueries({ earnings: { total_earnings: 0, trip_count: 0 }, onlineTime: { total_minutes: 45 } });
    await render(<StatCards />);

    expect(screen.getByText('45m')).toBeTruthy();
    expect(screen.queryByText('0h 45m')).toBeNull();
  });

  it('Test 14: both queries still loading renders the zero state without crashing', async () => {
    mockQueries({ earnings: undefined, onlineTime: undefined });
    await render(<StatCards />);

    expect(screen.getByText('RM 0.00')).toBeTruthy();
    expect(screen.getByText('0m')).toBeTruthy();
    expect(screen.queryByText(/NaN/)).toBeNull();
  });

  it('Test 15: both eyebrows render', async () => {
    mockQueries({ earnings: { total_earnings: 0, trip_count: 0 }, onlineTime: { total_minutes: 0 } });
    await render(<StatCards />);

    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('Online time')).toBeTruthy();
  });
});
