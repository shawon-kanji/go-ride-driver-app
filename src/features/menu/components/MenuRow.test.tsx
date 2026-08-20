import { fireEvent, render, screen } from '@testing-library/react-native';
import { View } from 'react-native';

import { MenuRow } from './MenuRow';

jest.mock('lucide-react-native', () => require('../../../test-utils/expo-mocks').createLucideMock());

describe('MenuRow', () => {
  it('Test 1: renders title, and subtitle when supplied', async () => {
    await render(
      <MenuRow icon={<View testID="row-icon" />} title="Profile" subtitle="Name, email, password" />,
    );

    expect(screen.getByText('Profile')).toBeTruthy();
    expect(screen.getByText('Name, email, password')).toBeTruthy();
  });

  it('Test 2: with onPress, pressing the row calls it exactly once', async () => {
    const onPress = jest.fn();
    await render(<MenuRow icon={<View testID="row-icon" />} title="Verification" onPress={onPress} testID="row" />);

    fireEvent.press(screen.getByTestId('row'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('Test 3: without onPress, pressing the row calls nothing and does not throw, and is dimmed', async () => {
    await render(<MenuRow icon={<View testID="row-icon" />} title="Earnings" testID="row" />);

    expect(() => fireEvent.press(screen.getByTestId('row'))).not.toThrow();
    expect(screen.getByTestId('row').props.className).toContain('opacity-');
  });

  it('Test 4: without onPress, no chevron icon is rendered', async () => {
    await render(<MenuRow icon={<View testID="row-icon" />} title="Earnings" />);

    expect(screen.queryByTestId('icon-ChevronRight')).toBeNull();
  });

  it('Test 5: with onPress, a chevron IS rendered', async () => {
    await render(<MenuRow icon={<View testID="row-icon" />} title="Verification" onPress={jest.fn()} />);

    expect(screen.getByTestId('icon-ChevronRight')).toBeTruthy();
  });

  it('Test 6: danger badge renders that label; omitting badge renders no badge', async () => {
    await render(
      <MenuRow
        icon={<View testID="row-icon" />}
        title="Verification"
        onPress={jest.fn()}
        badge={{ label: 'Action needed', tone: 'danger' }}
      />,
    );

    expect(screen.getByText('Action needed')).toBeTruthy();

    await render(<MenuRow icon={<View testID="row-icon" />} title="Profile" onPress={jest.fn()} />);
    expect(screen.queryByText('Action needed')).toBeNull();
  });

  it('Test 7: success badge renders that label', async () => {
    await render(
      <MenuRow
        icon={<View testID="row-icon" />}
        title="My vehicles"
        onPress={jest.fn()}
        badge={{ label: 'Active', tone: 'success' }}
      />,
    );

    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('Test 8: the row container className contains min-h-[56px]', async () => {
    await render(<MenuRow icon={<View testID="row-icon" />} title="Profile" testID="row" />);

    expect(screen.getByTestId('row').props.className).toContain('min-h-[56px]');
  });
});
