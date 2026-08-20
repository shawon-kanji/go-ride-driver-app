import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { VehicleCard } from './VehicleCard';
import type { Vehicle } from '../../../api/types';

jest.mock('lucide-react-native', () => require('../../../test-utils/expo-mocks').createLucideMock());
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));

const VEHICLE: Vehicle = {
  id: 'veh-1',
  driver_id: 'driver-1',
  plate_number: 'ABC 1234',
  color: 'Black',
  model_name: 'Toyota Vios',
  seat_count: 4,
  category: 'normal',
  is_active: false,
};

describe('VehicleCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Test 1: renders model_name as the title and the sub-line', async () => {
    await render(
      <VehicleCard vehicle={VEHICLE} onPress={jest.fn()} approvedDocumentCount={5} />,
    );

    expect(screen.getByText('Toyota Vios')).toBeTruthy();
    expect(screen.getByText('Black · 4 seats · normal')).toBeTruthy();
  });

  it('Test 2: footer renders PLATE and DOCUMENTS cells', async () => {
    await render(
      <VehicleCard vehicle={VEHICLE} onPress={jest.fn()} approvedDocumentCount={3} />,
    );

    expect(screen.getByText('ABC 1234')).toBeTruthy();
    expect(screen.getByText('3 of 5 approved')).toBeTruthy();
  });

  it('Test 3: approvedDocumentCount 5 renders DOCUMENTS value in text-success-700', async () => {
    await render(
      <VehicleCard vehicle={VEHICLE} onPress={jest.fn()} approvedDocumentCount={5} />,
    );

    expect(screen.getByText('5 of 5 approved').props.className).toContain('text-success-700');
  });

  it('Test 4: approvedDocumentCount 3 renders text-warning-700 and a warning strip with Fix', async () => {
    await render(
      <VehicleCard vehicle={VEHICLE} onPress={jest.fn()} approvedDocumentCount={3} />,
    );

    expect(screen.getByText('3 of 5 approved').props.className).toContain('text-warning-700');
    expect(screen.getByText(/2 documents missing/)).toBeTruthy();
    expect(screen.getByTestId('vehicle-fix')).toBeTruthy();
  });

  it('Test 5: unverified + onActivate renders a disabled muted Activate that does not fire', async () => {
    const onActivate = jest.fn();
    await render(
      <VehicleCard
        vehicle={VEHICLE}
        onPress={jest.fn()}
        approvedDocumentCount={3}
        onActivate={onActivate}
      />,
    );

    const activateButton = screen.getByTestId('vehicle-activate');
    expect(activateButton.props.accessibilityState?.disabled ?? activateButton.props.disabled).toBeTruthy();
    fireEvent.press(activateButton);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('Test 6: verified + inactive + onActivate renders an enabled Activate that fires onActivate', async () => {
    const onActivate = jest.fn();
    await render(
      <VehicleCard
        vehicle={VEHICLE}
        onPress={jest.fn()}
        approvedDocumentCount={5}
        onActivate={onActivate}
      />,
    );

    fireEvent.press(screen.getByTestId('vehicle-activate'));
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('Test 7: is_active true renders an Active badge, border-primary-500, and no Activate control', async () => {
    await render(
      <VehicleCard
        vehicle={{ ...VEHICLE, is_active: true }}
        onPress={jest.fn()}
        approvedDocumentCount={5}
        onActivate={jest.fn()}
      />,
    );

    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByTestId('vehicle-card').props.className).toContain('border-primary-500');
    expect(screen.queryByTestId('vehicle-activate')).toBeNull();
  });

  it('Test 8: pressing the card body calls onPress once', async () => {
    const onPress = jest.fn();
    await render(
      <VehicleCard vehicle={VEHICLE} onPress={onPress} approvedDocumentCount={5} />,
    );

    fireEvent.press(screen.getByTestId('vehicle-card-body'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('Test 9: pressing Fix routes to /verify preselected and does not call onPress', async () => {
    const onPress = jest.fn();
    await render(
      <VehicleCard vehicle={VEHICLE} onPress={onPress} approvedDocumentCount={3} />,
    );

    fireEvent.press(screen.getByTestId('vehicle-fix'));

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/verify',
      params: { vehicleId: VEHICLE.id },
    });
    expect(onPress).not.toHaveBeenCalled();
  });
});
