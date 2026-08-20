import { fireEvent, render, screen } from '@testing-library/react-native';

import { TextInput } from './TextInput';

jest.mock('lucide-react-native', () => require('../test-utils/expo-mocks').createLucideMock());

describe('TextInput', () => {
  it('renders the label and the base 52px field classes', async () => {
    await render(<TextInput label="Email" testID="email-input" />);

    expect(screen.getByText('Email')).toBeTruthy();
    const input = screen.getByTestId('email-input');
    expect(input.props.className).toContain('min-h-[52px]');
    expect(input.props.className).toContain('rounded-control');
    expect(input.props.className).toContain('border-neutral-300');
  });

  it('switches to a primary-500 focus border on focus, and back to neutral-300 on blur', async () => {
    await render(<TextInput label="Email" testID="email-input" />);

    const input = screen.getByTestId('email-input');
    await fireEvent(input, 'focus');
    expect(screen.getByTestId('email-input').props.className).toContain('border-primary-500');

    await fireEvent(input, 'blur');
    expect(screen.getByTestId('email-input').props.className).toContain('border-neutral-300');
  });

  it('renders errorText when provided, and omits it when absent', async () => {
    const { rerender } = await render(
      <TextInput label="Password" errorText="Use at least 8 characters." />,
    );

    expect(screen.getByText('Use at least 8 characters.')).toBeTruthy();

    await rerender(<TextInput label="Password" />);
    expect(screen.queryByText('Use at least 8 characters.')).toBeNull();
  });

  it('reveals and hides a secureTextEntry field via the reveal toggle', async () => {
    await render(
      <TextInput label="Password" testID="password-input" secureTextEntry revealToggle />,
    );

    const input = screen.getByTestId('password-input');
    expect(input.props.secureTextEntry).toBe(true);

    await fireEvent.press(screen.getByTestId('text-input-reveal'));
    expect(screen.getByTestId('password-input').props.secureTextEntry).toBe(false);

    await fireEvent.press(screen.getByTestId('text-input-reveal'));
    expect(screen.getByTestId('password-input').props.secureTextEntry).toBe(true);
  });

  it('renders no reveal toggle when revealToggle is not set', async () => {
    await render(<TextInput label="Password" secureTextEntry />);

    expect(screen.queryByTestId('text-input-reveal')).toBeNull();
  });

  it('still fires onChangeText (react-hook-form Controller wiring)', async () => {
    const onChangeText = jest.fn();
    await render(<TextInput label="Email" testID="email-input" onChangeText={onChangeText} />);

    await fireEvent.changeText(screen.getByTestId('email-input'), 'driver@example.com');

    expect(onChangeText).toHaveBeenCalledWith('driver@example.com');
  });
});
