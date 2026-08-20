import { fireEvent, render, screen } from '@testing-library/react-native';

import { ProfileChip } from './ProfileChip';

jest.mock('lucide-react-native', () => require('../../../test-utils/expo-mocks').createLucideMock());

describe('ProfileChip', () => {
  it('Test 1: renders first name and initials', async () => {
    await render(
      <ProfileChip
        firstName="Aisha"
        lastName="Baru"
        plate="WXY 4821"
        isOnline={false}
        hasAlert={false}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('Aisha')).toBeTruthy();
    expect(screen.getByText('AB')).toBeTruthy();
  });

  it('Test 2: offline sub-line reads "plate · offline"', async () => {
    await render(
      <ProfileChip
        firstName="Aisha"
        lastName="Baru"
        plate="WXY 4821"
        isOnline={false}
        hasAlert={false}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('WXY 4821 · offline')).toBeTruthy();
  });

  it('Test 3: online sub-line reads "plate · online"', async () => {
    await render(
      <ProfileChip
        firstName="Aisha"
        lastName="Baru"
        plate="WXY 4821"
        isOnline={true}
        hasAlert={false}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('WXY 4821 · online')).toBeTruthy();
  });

  it('Test 4: null plate renders "No vehicle · offline" and never renders null/undefined', async () => {
    await render(
      <ProfileChip
        firstName="Aisha"
        lastName="Baru"
        plate={null}
        isOnline={false}
        hasAlert={false}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('No vehicle · offline')).toBeTruthy();
    expect(screen.queryByText('null')).toBeNull();
    expect(screen.queryByText('undefined')).toBeNull();
  });

  it('Test 5: alert dot renders only when hasAlert is true', async () => {
    const { rerender } = await render(
      <ProfileChip
        firstName="Aisha"
        lastName="Baru"
        plate="WXY 4821"
        isOnline={false}
        hasAlert={true}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByTestId('profile-chip-alert')).toBeTruthy();

    await rerender(
      <ProfileChip
        firstName="Aisha"
        lastName="Baru"
        plate="WXY 4821"
        isOnline={false}
        hasAlert={false}
        onPress={jest.fn()}
      />,
    );

    expect(screen.queryByTestId('profile-chip-alert')).toBeNull();
  });

  it('Test 6: pressing the chip calls onPress once', async () => {
    const onPress = jest.fn();
    await render(
      <ProfileChip
        firstName="Aisha"
        lastName="Baru"
        plate="WXY 4821"
        isOnline={false}
        hasAlert={false}
        onPress={onPress}
        testID="profile-chip"
      />,
    );

    await fireEvent.press(screen.getByTestId('profile-chip'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
