import { fireEvent, render, screen } from '@testing-library/react-native';

import { SegmentedControl } from './SegmentedControl';

const OPTIONS = [
  { label: 'Normal', value: 'normal' as const },
  { label: 'Luxury', value: 'luxury' as const },
];

describe('SegmentedControl', () => {
  it('Test 1: renders the label and every option label', async () => {
    await render(
      <SegmentedControl label="Category" value="normal" options={OPTIONS} onChange={jest.fn()} />,
    );

    expect(screen.getByText('Category')).toBeTruthy();
    expect(screen.getByText('Normal')).toBeTruthy();
    expect(screen.getByText('Luxury')).toBeTruthy();
  });

  it('Test 2: the selected segment has bg-primary-500, others do not', async () => {
    await render(
      <SegmentedControl label="Category" value="normal" options={OPTIONS} onChange={jest.fn()} />,
    );

    expect(screen.getByTestId('segment-normal').props.className).toContain('bg-primary-500');
    expect(screen.getByTestId('segment-luxury').props.className).not.toContain('bg-primary-500');
  });

  it('Test 3: the selected label has text-white, an unselected label has text-neutral-600', async () => {
    await render(
      <SegmentedControl label="Category" value="normal" options={OPTIONS} onChange={jest.fn()} />,
    );

    expect(screen.getByText('Normal').props.className).toContain('text-white');
    expect(screen.getByText('Luxury').props.className).toContain('text-neutral-600');
  });

  it('Test 4: pressing an unselected segment calls onChange with that value exactly once', async () => {
    const onChange = jest.fn();
    await render(
      <SegmentedControl label="Category" value="normal" options={OPTIONS} onChange={onChange} />,
    );

    fireEvent.press(screen.getByTestId('segment-luxury'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('luxury');
  });

  it('Test 5: pressing the already-selected segment still calls onChange with the same value', async () => {
    const onChange = jest.fn();
    await render(
      <SegmentedControl label="Category" value="normal" options={OPTIONS} onChange={onChange} />,
    );

    fireEvent.press(screen.getByTestId('segment-normal'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('normal');
  });

  it('Test 6: the container has rounded-control and each segment is at least min-h-[44px]', async () => {
    await render(
      <SegmentedControl
        label="Category"
        value="normal"
        options={OPTIONS}
        onChange={jest.fn()}
        testID="category-segmented"
      />,
    );

    expect(screen.getByTestId('category-segmented').props.className).toContain('rounded-control');
    expect(screen.getByTestId('segment-normal').props.className).toContain('min-h-[44px]');
    expect(screen.getByTestId('segment-luxury').props.className).toContain('min-h-[44px]');
  });
});
