import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import MenuScreen from './menu';
import { useKycStatusQuery } from '../../features/kyc/api';
import { useLogout } from '../../features/profile/logout';
import { useProfileQuery } from '../../features/profile/api';
import { useVehiclesQuery } from '../../features/vehicles/api';
import { makeDocument, makeKycStatus } from '../../test-utils/kyc-fixtures';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() } }));
jest.mock('lucide-react-native', () => require('../../test-utils/expo-mocks').createLucideMock());
jest.mock('../../features/profile/api', () => ({ useProfileQuery: jest.fn(), profileKeys: { detail: () => ['profile'] } }));
jest.mock('../../features/vehicles/api', () => ({ useVehiclesQuery: jest.fn() }));
jest.mock('../../features/kyc/api', () => ({ useKycStatusQuery: jest.fn() }));
jest.mock('../../features/profile/logout', () => ({ useLogout: jest.fn() }));

const mockUseProfileQuery = useProfileQuery as jest.Mock;
const mockUseVehiclesQuery = useVehiclesQuery as jest.Mock;
const mockUseKycStatusQuery = useKycStatusQuery as jest.Mock;
const mockUseLogout = useLogout as jest.Mock;

const DRIVER = { id: 'd1', first_name: 'Amir', last_name: 'Hassan', is_online: false };
const VEHICLE = {
  id: 'v1',
  plate_number: 'WXY 4821',
  is_active: true,
  color: 'Black',
  model_name: 'Myvi',
  seat_count: 4,
  category: 'normal',
};

function mockQueries({
  profile = { driver: DRIVER },
  vehicles = { vehicles: [VEHICLE] },
  kyc = makeKycStatus({ kyc_status: 'approved' }),
}: {
  profile?: { driver: typeof DRIVER } | undefined;
  vehicles?: { vehicles: typeof VEHICLE[] } | undefined;
  kyc?: ReturnType<typeof makeKycStatus>;
} = {}) {
  mockUseProfileQuery.mockReturnValue({ data: profile });
  mockUseVehiclesQuery.mockReturnValue({ data: vehicles });
  mockUseKycStatusQuery.mockReturnValue({ data: kyc });
}

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

describe('MenuScreen', () => {
  const logoutFn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLogout.mockReturnValue(logoutFn);
    mockQueries({ kyc: approvedKyc() });
  });

  it('Test 1: renders the driver full name and initials', async () => {
    await render(<MenuScreen />);

    expect(screen.getByText('Amir Hassan')).toBeTruthy();
    expect(screen.getByText('AH')).toBeTruthy();
  });

  it('Test 2: ready gate shows the ready status line and no warning banner', async () => {
    await render(<MenuScreen />);

    expect(screen.getByText('Account active · ready to drive')).toBeTruthy();
    expect(screen.queryByTestId('menu-warning-banner')).toBeNull();
  });

  it('Test 3: identity_blocked gate shows the blocked status line and a warning banner', async () => {
    mockQueries({ kyc: makeKycStatus({ kyc_status: 'not_started', documents: [] }) });

    await render(<MenuScreen />);

    expect(screen.getByText('Account active · not yet cleared to drive')).toBeTruthy();
    expect(screen.getByTestId('menu-warning-banner')).toBeTruthy();
    expect(screen.getByText(/Can't go online:/)).toBeTruthy();
  });

  it('Test 4: Verification row shows Action needed badge only when blocked', async () => {
    mockQueries({ kyc: makeKycStatus({ kyc_status: 'not_started', documents: [] }) });
    await render(<MenuScreen />);
    expect(screen.getByText('Action needed')).toBeTruthy();

    mockQueries({ kyc: approvedKyc() });
    await render(<MenuScreen />);
    expect(screen.queryByText('Action needed')).toBeNull();
  });

  it('Test 5: My vehicles row shows Active badge with an active vehicle, none without', async () => {
    await render(<MenuScreen />);
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText(/WXY 4821/)).toBeTruthy();

    mockQueries({ vehicles: { vehicles: [] }, kyc: approvedKyc() });
    await render(<MenuScreen />);
    expect(screen.queryByText('Active')).toBeNull();
  });

  it('Test 6: rows route to /verify, /vehicles, /profile', async () => {
    await render(<MenuScreen />);

    await fireEvent.press(screen.getByTestId('menu-row-verification'));
    expect(router.push).toHaveBeenCalledWith('/verify');

    await fireEvent.press(screen.getByTestId('menu-row-vehicles'));
    expect(router.push).toHaveBeenCalledWith('/vehicles');

    await fireEvent.press(screen.getByTestId('menu-row-profile'));
    expect(router.push).toHaveBeenCalledWith('/profile');
  });

  it('Test 7: Earnings, Trip history, and Settings all render', async () => {
    await render(<MenuScreen />);

    expect(screen.getByText('Earnings')).toBeTruthy();
    expect(screen.getByText('Trip history')).toBeTruthy();
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('Test 8: pressing Earnings does not call router.push', async () => {
    await render(<MenuScreen />);

    await fireEvent.press(screen.getByTestId('menu-row-earnings'));
    expect(router.push).not.toHaveBeenCalled();
  });

  it('Test 9: coming-soon rows render no subtitle', async () => {
    await render(<MenuScreen />);

    expect(screen.queryByText(/this week/)).toBeNull();
    expect(screen.queryByText(/completed trips/)).toBeNull();
    expect(screen.queryByText(/Notifications, language/)).toBeNull();
  });

  it('Test 10: pressing Log out calls useLogout callback once with no confirmation dialog', async () => {
    await render(<MenuScreen />);

    await fireEvent.press(screen.getByTestId('menu-logout'));

    expect(logoutFn).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Are you sure/i)).toBeNull();
  });

  it('Test 11: pressing the back control calls router.back', async () => {
    await render(<MenuScreen />);

    await fireEvent.press(screen.getByTestId('menu-back'));

    expect(router.back).toHaveBeenCalledTimes(1);
  });
});
