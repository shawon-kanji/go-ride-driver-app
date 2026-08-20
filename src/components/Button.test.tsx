import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from './Button';

describe('Button', () => {
  it('defaults to the rect shape (rounded-control), not pill', async () => {
    await render(<Button label="Sign in" onPress={jest.fn()} testID="btn" />);

    const className = screen.getByTestId('btn').props.className as string;
    expect(className).toContain('rounded-control');
    expect(className).not.toContain('rounded-pill');
  });

  it('renders rounded-pill when shape="pill"', async () => {
    await render(<Button label="Go online" onPress={jest.fn()} shape="pill" testID="btn" />);

    const className = screen.getByTestId('btn').props.className as string;
    expect(className).toContain('rounded-pill');
    expect(className).not.toContain('rounded-control');
  });

  it('applies min-height classes per size', async () => {
    const { rerender } = await render(
      <Button label="A" onPress={jest.fn()} size="compact" testID="btn" />
    );
    expect(screen.getByTestId('btn').props.className as string).toContain('min-h-[36px]');

    await rerender(<Button label="A" onPress={jest.fn()} size="default" testID="btn" />);
    expect(screen.getByTestId('btn').props.className as string).toContain('min-h-[48px]');

    await rerender(<Button label="A" onPress={jest.fn()} size="large" testID="btn" />);
    expect(screen.getByTestId('btn').props.className as string).toContain('min-h-[54px]');
  });

  it('calls onPress once when pressed', async () => {
    const onPress = jest.fn();
    await render(<Button label="Sign in" onPress={onPress} testID="btn" />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('never calls onPress when disabled', async () => {
    const onPressDisabled = jest.fn();
    await render(
      <Button label="Sign in" onPress={onPressDisabled} disabled testID="btn-disabled" />
    );
    fireEvent.press(screen.getByTestId('btn-disabled'));
    expect(onPressDisabled).not.toHaveBeenCalled();
  });

  it('shows an ActivityIndicator and never calls onPress while loading', async () => {
    const onPress = jest.fn();
    await render(<Button label="Sign in" onPress={onPress} loading testID="btn" />);

    expect(screen.getByTestId('btn-spinner')).toBeTruthy();

    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders the label with font-jakarta-bold', async () => {
    await render(<Button label="Sign in" onPress={jest.fn()} testID="btn" />);

    expect(screen.getByText('Sign in').props.className as string).toContain('font-jakarta-bold');
  });

  it('renders success variant with bg-success-500 and white text', async () => {
    await render(<Button label="Go online" onPress={jest.fn()} variant="success" testID="btn" />);

    expect(screen.getByTestId('btn').props.className as string).toContain('bg-success-500');
    expect(screen.getByText('Go online').props.className as string).toContain('text-white');
  });

  it('renders muted variant with bg-neutral-200 and neutral-500 text', async () => {
    await render(<Button label="Go online" onPress={jest.fn()} variant="muted" testID="btn" />);

    expect(screen.getByTestId('btn').props.className as string).toContain('bg-neutral-200');
    expect(screen.getByText('Go online').props.className as string).toContain('text-neutral-500');
  });

  it('renders dark variant with bg-neutral-900 and white text', async () => {
    await render(<Button label="Register vehicle" onPress={jest.fn()} variant="dark" testID="btn" />);

    expect(screen.getByTestId('btn').props.className as string).toContain('bg-neutral-900');
    expect(screen.getByText('Register vehicle').props.className as string).toContain('text-white');
  });

  it('renders tonal variant with bg-primary-50 and primary-700 text', async () => {
    await render(<Button label="Upload" onPress={jest.fn()} variant="tonal" testID="btn" />);

    expect(screen.getByTestId('btn').props.className as string).toContain('bg-primary-50');
    expect(screen.getByText('Upload').props.className as string).toContain('text-primary-700');
  });

  it('renders destructive-outline variant with a border, no danger fill, and danger-600 text', async () => {
    await render(
      <Button label="Log out" onPress={jest.fn()} variant="destructive-outline" testID="btn" />
    );

    const className = screen.getByTestId('btn').props.className as string;
    expect(className).toContain('border-neutral-300');
    expect(className).not.toContain('bg-danger-500');
    expect(screen.getByText('Log out').props.className as string).toContain('text-danger-600');
  });

  it('never calls onPress when muted and disabled', async () => {
    const onPress = jest.fn();
    await render(
      <Button label="Go online" onPress={onPress} variant="muted" disabled testID="btn" />
    );

    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
