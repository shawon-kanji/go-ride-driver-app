import { render, screen } from '@testing-library/react-native';

import { StatusDisc } from './StatusDisc';

jest.mock('lucide-react-native', () => require('../../../test-utils/expo-mocks').createLucideMock());

describe('StatusDisc', () => {
  it('Test 11: approved renders a success-tinted disc', async () => {
    await render(<StatusDisc state="approved" testID="disc" />);
    expect(screen.getByTestId('disc').props.className).toContain('bg-success-500');
  });

  it('Test 12: in_review renders a warning-tinted disc', async () => {
    await render(<StatusDisc state="in_review" testID="disc" />);
    expect(screen.getByTestId('disc').props.className).toContain('bg-warning-500');
  });

  it('Test 13: rejected renders a danger-tinted disc', async () => {
    await render(<StatusDisc state="rejected" testID="disc" />);
    expect(screen.getByTestId('disc').props.className).toContain('bg-danger-500');
  });

  it('Test 14: missing renders a dashed outline with no fill colour', async () => {
    await render(<StatusDisc state="missing" testID="disc" />);
    const className = screen.getByTestId('disc').props.className;
    expect(className).toContain('border-dashed');
    expect(className).toContain('border-neutral-300');
    expect(className).not.toContain('bg-success-500');
    expect(className).not.toContain('bg-warning-500');
    expect(className).not.toContain('bg-danger-500');
  });
});
