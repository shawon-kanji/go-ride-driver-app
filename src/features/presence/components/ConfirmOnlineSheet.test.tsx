import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ApiError } from '../../../api/http-client';
import { createQueryWrapper, createTestQueryClient } from '../../../test-utils/query-wrapper';
import type { Vehicle } from '../../../api/types';

jest.mock('lucide-react-native', () => require('../../../test-utils/expo-mocks').createLucideMock());
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));
jest.mock('../permissions', () => ({ ensureForegroundLocation: jest.fn() }));
jest.mock('../../../api/driver-client', () => ({ driverClient: { setOnlineStatus: jest.fn() } }));

import { router } from 'expo-router';
import { ensureForegroundLocation } from '../permissions';
import { driverClient } from '../../../api/driver-client';
import { ConfirmOnlineSheet } from './ConfirmOnlineSheet';

const VEHICLE: Vehicle = {
  id: 'v1',
  driver_id: 'd1',
  plate_number: 'ABC 1234',
  color: 'White',
  model_name: 'Toyota Vios',
  seat_count: 4,
  category: 'normal',
  is_active: true,
};

const ensureForegroundLocationMock = ensureForegroundLocation as jest.Mock;
const setOnlineStatusMock = driverClient.setOnlineStatus as jest.Mock;

async function renderSheet(overrides: Partial<Parameters<typeof ConfirmOnlineSheet>[0]> = {}) {
  const onDismiss = jest.fn();
  const onWentOnline = jest.fn();
  const client = createTestQueryClient();
  const props = {
    visible: true,
    vehicle: VEHICLE,
    approvedDocumentCount: 5,
    onDismiss,
    onWentOnline,
    ...overrides,
  };
  const utils = await render(<ConfirmOnlineSheet {...props} />, {
    wrapper: createQueryWrapper(client),
  });
  return { ...utils, onDismiss, onWentOnline };
}

describe('ConfirmOnlineSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ensureForegroundLocationMock.mockResolvedValue('granted');
    setOnlineStatusMock.mockResolvedValue({ driver: { id: 'd1', is_online: true } });
  });

  it('renders nothing queryable when not visible', async () => {
    await renderSheet({ visible: false });
    expect(screen.queryByText('Go online with this vehicle?')).toBeNull();
  });

  it('renders the title, vehicle details, and sub-line when visible', async () => {
    await renderSheet();
    expect(screen.getByText('Go online with this vehicle?')).toBeTruthy();
    expect(screen.getByText('Toyota Vios')).toBeTruthy();
    expect(screen.getByText('ABC 1234')).toBeTruthy();
    expect(screen.getByText('White · 4 seats · normal')).toBeTruthy();
  });

  it('renders the approved-documents strip only at full count', async () => {
    const { unmount } = await renderSheet({ approvedDocumentCount: 5 });
    expect(screen.getByText('All 5 documents approved')).toBeTruthy();
    await unmount();

    await renderSheet({ approvedDocumentCount: 4 });
    expect(screen.queryByText('All 5 documents approved')).toBeNull();
  });

  it('renders the location-sharing note', async () => {
    await renderSheet();
    expect(
      screen.getByText("Your location is shared while you're online, and stops the moment you go offline."),
    ).toBeTruthy();
  });

  it('pressing Switch vehicle dismisses and navigates without calling the mutation', async () => {
    const { onDismiss } = await renderSheet();
    await fireEvent.press(screen.getByTestId('confirm-online-switch'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith('/vehicles');
    expect(setOnlineStatusMock).not.toHaveBeenCalled();
  });

  it('pressing Go online with granted permission calls setOnlineStatus(true) then onWentOnline', async () => {
    const { onWentOnline } = await renderSheet();
    await fireEvent.press(screen.getByTestId('confirm-online-go'));
    await waitFor(() => expect(setOnlineStatusMock).toHaveBeenCalledWith(true));
    await waitFor(() => expect(onWentOnline).toHaveBeenCalledTimes(1));
  });

  it('denied permission shows the Turn on location explainer and does not go online', async () => {
    ensureForegroundLocationMock.mockResolvedValue('denied');
    const { onWentOnline } = await renderSheet();
    await fireEvent.press(screen.getByTestId('confirm-online-go'));
    expect(await screen.findByText('Turn on location')).toBeTruthy();
    expect(setOnlineStatusMock).not.toHaveBeenCalled();
    expect(onWentOnline).not.toHaveBeenCalled();
    expect(screen.getByText('Go online with this vehicle?')).toBeTruthy();
  });

  it('services_off shows the services-off explainer and does not go online', async () => {
    ensureForegroundLocationMock.mockResolvedValue('services_off');
    await renderSheet();
    await fireEvent.press(screen.getByTestId('confirm-online-go'));
    expect(
      await screen.findByText('Location services are off on this device. Turn them on in your device settings, then try again.'),
    ).toBeTruthy();
    expect(setOnlineStatusMock).not.toHaveBeenCalled();
  });

  it('Try again after a denial re-invokes ensureForegroundLocation and proceeds once granted', async () => {
    ensureForegroundLocationMock.mockResolvedValueOnce('denied');
    await renderSheet();
    await fireEvent.press(screen.getByTestId('confirm-online-go'));
    const tryAgain = await screen.findByText('Try again');

    ensureForegroundLocationMock.mockResolvedValueOnce('granted');
    await fireEvent.press(tryAgain);

    await waitFor(() => expect(ensureForegroundLocationMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(setOnlineStatusMock).toHaveBeenCalledWith(true));
  });

  it('a 403 KYC rejection renders KycBlockedBanner identity copy, not the generic failure line', async () => {
    setOnlineStatusMock.mockRejectedValue(
      new ApiError(403, { code: 'KYC_NOT_APPROVED', message: 'not approved' }),
    );
    await renderSheet();
    await fireEvent.press(screen.getByTestId('confirm-online-go'));
    expect(
      await screen.findByText(
        "Your identity documents aren't approved yet. Upload or fix them to activate a vehicle and go online.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Couldn't go online. Check your connection and try again.")).toBeNull();
  });

  it('a 500 failure renders the generic failure line and keeps the sheet visible', async () => {
    setOnlineStatusMock.mockRejectedValue(new ApiError(500, { code: 'INTERNAL', message: 'boom' }));
    await renderSheet();
    await fireEvent.press(screen.getByTestId('confirm-online-go'));
    expect(await screen.findByText("Couldn't go online. Check your connection and try again.")).toBeTruthy();
    expect(screen.getByText('Go online with this vehicle?')).toBeTruthy();
  });

  it('shows a loading state while pending and does not fire a second mutation on a second press', async () => {
    let resolveMutation!: (value: { driver: { id: string; is_online: boolean } }) => void;
    setOnlineStatusMock.mockReturnValue(
      new Promise((resolve) => {
        resolveMutation = resolve;
      }),
    );
    await renderSheet();
    await fireEvent.press(screen.getByTestId('confirm-online-go'));
    await waitFor(() => expect(screen.getByTestId('confirm-online-go-spinner')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('confirm-online-go'));
    expect(setOnlineStatusMock).toHaveBeenCalledTimes(1);

    resolveMutation({ driver: { id: 'd1', is_online: true } });
    await waitFor(() => expect(screen.queryByTestId('confirm-online-go-spinner')).toBeNull());
  });

  it('does not call ensureForegroundLocation on mount, only on the Go online press', async () => {
    await renderSheet();
    expect(ensureForegroundLocationMock).toHaveBeenCalledTimes(0);
    await fireEvent.press(screen.getByTestId('confirm-online-go'));
    await waitFor(() => expect(ensureForegroundLocationMock).toHaveBeenCalledTimes(1));
  });
});
