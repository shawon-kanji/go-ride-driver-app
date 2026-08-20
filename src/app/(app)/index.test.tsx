import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import HomeScreen from './index';
import { useKycStatusQuery } from '../../features/kyc/api';
import { useProfileQuery } from '../../features/profile/api';
import { useSetOnlineStatusMutation } from '../../features/presence/api';
import { useVehiclesQuery } from '../../features/vehicles/api';
import { makeDocument, makeKycStatus } from '../../test-utils/kyc-fixtures';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() } }));
jest.mock('lucide-react-native', () => require('../../test-utils/expo-mocks').createLucideMock());
jest.mock('../../features/presence/components/HomeMap', () => ({ HomeMap: jest.fn(() => null) }));
jest.mock('../../features/presence/components/ConfirmOnlineSheet', () => ({
  ConfirmOnlineSheet: (p: { visible: boolean }) =>
    p.visible
      ? require('react').createElement(require('react-native').View, { testID: 'confirm-sheet-visible' })
      : null,
}));
jest.mock('../../features/presence/use-home-coords', () => ({
  useHomeCoords: jest.fn(() => ({ latitude: 3.139, longitude: 101.6869 })),
}));
jest.mock('../../features/presence/api', () => ({
  useSetOnlineStatusMutation: jest.fn(),
  useTodayEarningsQuery: jest.fn(() => ({ data: { total_earnings: 0, trip_count: 0 } })),
  useTodayOnlineTimeQuery: jest.fn(() => ({ data: { total_minutes: 0 } })),
}));
jest.mock('../../features/profile/api', () => ({
  useProfileQuery: jest.fn(),
  profileKeys: { detail: () => ['profile'] },
}));
jest.mock('../../features/vehicles/api', () => ({ useVehiclesQuery: jest.fn() }));
jest.mock('../../features/kyc/api', () => ({ useKycStatusQuery: jest.fn() }));

const mockUseProfileQuery = useProfileQuery as jest.Mock;
const mockUseVehiclesQuery = useVehiclesQuery as jest.Mock;
const mockUseKycStatusQuery = useKycStatusQuery as jest.Mock;
const mockUseSetOnlineStatusMutation = useSetOnlineStatusMutation as jest.Mock;
const mockHomeMap = jest.requireMock('../../features/presence/components/HomeMap').HomeMap as jest.Mock;

const DRIVER = { id: 'd1', first_name: 'Aisha', last_name: 'Baru', is_online: false };
const VEHICLE = {
  id: 'v1',
  plate_number: 'WXY 4821',
  is_active: true,
  color: 'Black',
  model_name: 'Myvi',
  seat_count: 4,
  category: 'normal',
};

function approvedKyc() {
  return makeKycStatus({
    kyc_status: 'approved',
    documents: [
      makeDocument('selfie', { status: 'approved' }),
      makeDocument('govt_id_front', { status: 'approved' }),
      makeDocument('govt_id_back', { status: 'approved' }),
      makeDocument('driving_license_front', { status: 'approved' }),
      makeDocument('driving_license_back', { status: 'approved' }),
      makeDocument('vehicle_registration', { status: 'approved', vehicle_id: 'v1' }),
      makeDocument('vehicle_photo_front', { status: 'approved', vehicle_id: 'v1' }),
      makeDocument('vehicle_photo_back', { status: 'approved', vehicle_id: 'v1' }),
      makeDocument('vehicle_photo_side', { status: 'approved', vehicle_id: 'v1' }),
      makeDocument('vehicle_number_plate', { status: 'approved', vehicle_id: 'v1' }),
    ],
  });
}

function mockQueries({
  driver = DRIVER,
  vehicles = [VEHICLE],
  kyc = approvedKyc(),
}: {
  driver?: typeof DRIVER;
  vehicles?: (typeof VEHICLE)[];
  kyc?: ReturnType<typeof makeKycStatus>;
} = {}) {
  mockUseProfileQuery.mockReturnValue({ data: { driver } });
  mockUseVehiclesQuery.mockReturnValue({ data: { vehicles } });
  mockUseKycStatusQuery.mockReturnValue({ data: kyc });
}

describe('HomeScreen (D06)', () => {
  const mutateFn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSetOnlineStatusMutation.mockReturnValue({ mutate: mutateFn, isPending: false });
    mockQueries();
  });

  it('Test 1: pressing the profile chip calls router.push("/menu")', async () => {
    await render(<HomeScreen />);

    await fireEvent.press(screen.getByTestId('home-profile-chip'));

    expect(router.push).toHaveBeenCalledWith('/menu');
  });

  it('Test 2: no_vehicle gate -> pressing Go online routes to /vehicles, sheet stays hidden', async () => {
    mockQueries({ vehicles: [] });
    await render(<HomeScreen />);

    await fireEvent.press(screen.getByTestId('home-go-online'));

    expect(router.push).toHaveBeenCalledWith('/vehicles');
    expect(screen.queryByTestId('confirm-sheet-visible')).toBeNull();
  });

  it('Test 3: no_active_vehicle gate -> same as no_vehicle', async () => {
    mockQueries({ vehicles: [{ ...VEHICLE, is_active: false }] });
    await render(<HomeScreen />);

    await fireEvent.press(screen.getByTestId('home-go-online'));

    expect(router.push).toHaveBeenCalledWith('/vehicles');
    expect(screen.queryByTestId('confirm-sheet-visible')).toBeNull();
  });

  it('Test 4: identity_blocked gate disables Go online and shows the identity banner', async () => {
    mockQueries({ kyc: makeKycStatus({ kyc_status: 'not_started', documents: [] }) });
    await render(<HomeScreen />);

    expect(screen.getByText(/identity documents aren't approved yet/)).toBeTruthy();
    const button = screen.getByTestId('home-go-online');
    expect(button.props.accessibilityState?.disabled).toBe(true);

    await fireEvent.press(button);
    expect(screen.queryByTestId('confirm-sheet-visible')).toBeNull();
  });

  it('Test 5: identity_blocked gate -> pressing "Go to Verify" routes to /verify', async () => {
    mockQueries({ kyc: makeKycStatus({ kyc_status: 'not_started', documents: [] }) });
    await render(<HomeScreen />);

    await fireEvent.press(screen.getByText('Go to Verify'));

    expect(router.push).toHaveBeenCalledWith('/verify');
  });

  it('Test 6: vehicle_blocked gate shows the vehicle banner copy', async () => {
    mockQueries({ kyc: makeKycStatus({ kyc_status: 'approved', documents: [] }) });
    await render(<HomeScreen />);

    expect(screen.getByText(/vehicle's documents aren't approved yet/)).toBeTruthy();
  });

  it('Test 7: ready gate -> pressing Go online opens the confirm sheet and calls no router method', async () => {
    await render(<HomeScreen />);

    await fireEvent.press(screen.getByTestId('home-go-online'));

    expect(screen.getByTestId('confirm-sheet-visible')).toBeTruthy();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('Test 8: Go online button className tracks gate state', async () => {
    await render(<HomeScreen />);
    expect(screen.getByTestId('home-go-online').props.className).toContain('bg-success-500');

    mockQueries({ vehicles: [] });
    await render(<HomeScreen />);
    expect(screen.getByTestId('home-go-online').props.className).toContain('bg-neutral-200');
  });

  it('Test 9: online driver sees Go offline, not Go online; pressing it mutates with false', async () => {
    mockQueries({ driver: { ...DRIVER, is_online: true } });
    await render(<HomeScreen />);

    expect(screen.queryByTestId('home-go-online')).toBeNull();
    const offlineButton = screen.getByTestId('home-go-offline');
    expect(offlineButton).toBeTruthy();

    await fireEvent.press(offlineButton);
    expect(mutateFn).toHaveBeenCalledWith(false);
  });

  it('Test 10: online driver -> profile chip sub-line ends in "· online"', async () => {
    mockQueries({ driver: { ...DRIVER, is_online: true } });
    await render(<HomeScreen />);

    expect(screen.getByText(/· online$/)).toBeTruthy();
  });

  it('Test 11: the Phase 01.1 Verification card still renders and routes to /verify', async () => {
    await render(<HomeScreen />);

    expect(screen.getByText('Verification')).toBeTruthy();
    expect(screen.getByText('Approved')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('home-kyc-card'));
    expect(router.push).toHaveBeenCalledWith('/verify');
  });

  it('Test 12: ready gate -> no alert dot; identity_blocked gate -> alert dot present', async () => {
    await render(<HomeScreen />);
    expect(screen.queryByTestId('profile-chip-alert')).toBeNull();

    mockQueries({ kyc: makeKycStatus({ kyc_status: 'not_started', documents: [] }) });
    await render(<HomeScreen />);
    expect(screen.getByTestId('profile-chip-alert')).toBeTruthy();
  });

  it('Test 13: footer note renders only while offline', async () => {
    await render(<HomeScreen />);
    expect(
      screen.getByText("Once you're cleared, Go online asks you to confirm the vehicle first."),
    ).toBeTruthy();

    mockQueries({ driver: { ...DRIVER, is_online: true } });
    await render(<HomeScreen />);
    expect(
      screen.queryByText("Once you're cleared, Go online asks you to confirm the vehicle first."),
    ).toBeNull();
  });

  it('Test 14: HomeMap renders exactly once and receives useHomeCoords coords', async () => {
    await render(<HomeScreen />);

    expect(mockHomeMap).toHaveBeenCalledTimes(1);
    expect(mockHomeMap.mock.calls[0][0].coords).toEqual({ latitude: 3.139, longitude: 101.6869 });
  });
});
