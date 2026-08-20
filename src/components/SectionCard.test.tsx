import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { SectionCard } from './SectionCard';

describe('SectionCard', () => {
  it('renders the eyebrow string', async () => {
    await render(
      <SectionCard eyebrow="Account">
        <Text>content</Text>
      </SectionCard>
    );

    expect(screen.getByText('Account')).toBeTruthy();
  });

  it('renders meta when provided and omits it when not', async () => {
    const { rerender } = await render(
      <SectionCard eyebrow="Documents" meta="4 of 5 uploaded">
        <Text>content</Text>
      </SectionCard>
    );
    expect(screen.getByText('4 of 5 uploaded')).toBeTruthy();

    await rerender(
      <SectionCard eyebrow="Documents">
        <Text>content</Text>
      </SectionCard>
    );
    expect(screen.queryByText('4 of 5 uploaded')).toBeNull();
  });

  it('renders children inside the card', async () => {
    await render(
      <SectionCard eyebrow="Account">
        <Text>Row 1</Text>
      </SectionCard>
    );

    expect(screen.getByText('Row 1')).toBeTruthy();
  });

  it('applies rounded-card and border-neutral-200 to the container', async () => {
    await render(
      <SectionCard eyebrow="Account" testID="section-card">
        <Text>content</Text>
      </SectionCard>
    );

    const className = screen.getByTestId('section-card').props.className as string;
    expect(className).toContain('rounded-card');
    expect(className).toContain('border-neutral-200');
  });
});
