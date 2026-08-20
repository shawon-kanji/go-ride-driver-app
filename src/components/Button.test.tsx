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

  it('calls onPress once when pressed, and never when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Sign in" onPress={onPress} testID="btn" />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).toHaveBeenCalledTimes(1);

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
});
