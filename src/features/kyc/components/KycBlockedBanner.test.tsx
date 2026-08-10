import { fireEvent, render, screen } from '@testing-library/react-native';

import { KycBlockedBanner } from './KycBlockedBanner';

describe('KycBlockedBanner', () => {
  it('renders identity-specific copy when reason is identity', () => {
    render(<KycBlockedBanner reason="identity" onPressAction={jest.fn()} />);

    expect(screen.getByText(/identity documents/)).toBeTruthy();
    expect(screen.queryByText(/This vehicle/)).toBeNull();
  });

  it('renders vehicle-specific copy when reason is vehicle', () => {
    render(<KycBlockedBanner reason="vehicle" onPressAction={jest.fn()} />);

    expect(screen.getByText(/This vehicle/)).toBeTruthy();
    expect(screen.queryByText(/identity documents/)).toBeNull();
  });

  it('calls onPressAction when the verify CTA is pressed', () => {
    const onPressAction = jest.fn();
    render(<KycBlockedBanner reason="identity" onPressAction={onPressAction} />);

    fireEvent.press(screen.getByText('Go to Verify'));

    expect(onPressAction).toHaveBeenCalledTimes(1);
  });
});
