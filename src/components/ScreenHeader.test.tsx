import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { ScreenHeader } from './ScreenHeader';

jest.mock('lucide-react-native', () => require('../test-utils/expo-mocks').createLucideMock());
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));

describe('ScreenHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the title string', async () => {
    await render(<ScreenHeader title="Menu" />);

    expect(screen.getByText('Menu')).toBeTruthy();
  });

  it('calls router.back() when pressed with no onBack prop', async () => {
    await render(<ScreenHeader title="Menu" />);

    fireEvent.press(screen.getByTestId('screen-header-back'));
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('calls the explicit onBack callback instead of router.back()', async () => {
    const onBack = jest.fn();
    await render(<ScreenHeader title="Menu" onBack={onBack} />);

    fireEvent.press(screen.getByTestId('screen-header-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(router.back).not.toHaveBeenCalled();
  });

  it('renders no back control when onBack is null', async () => {
    await render(<ScreenHeader title="Menu" onBack={null} />);

    expect(screen.queryByTestId('screen-header-back')).toBeNull();
  });

  it('renders the right slot node', async () => {
    await render(<ScreenHeader title="Menu" right={<Text>Save</Text>} />);

    expect(screen.getByText('Save')).toBeTruthy();
  });

  it('gives the back control a 44x44 minimum hit target', async () => {
    await render(<ScreenHeader title="Menu" />);

    const className = screen.getByTestId('screen-header-back').props.className as string;
    expect(className).toContain('h-11');
    expect(className).toContain('w-11');
  });
});
