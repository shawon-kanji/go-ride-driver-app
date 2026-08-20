import { fireEvent, render, screen } from '@testing-library/react-native';

import { DocumentTile } from './DocumentTile';
import { makeDocument } from '../../../test-utils/kyc-fixtures';

jest.mock('lucide-react-native', () => require('../../../test-utils/expo-mocks').createLucideMock());

describe('DocumentTile', () => {
  it('Test 1: no document renders the label, a missing disc, and an Upload button', async () => {
    await render(
      <DocumentTile documentType="govt_id_front" document={undefined} onPress={jest.fn()} />,
    );

    expect(screen.getByText('Government ID (front)')).toBeTruthy();
    expect(screen.getByTestId('status-disc-missing')).toBeTruthy();
    expect(screen.getByText('Upload')).toBeTruthy();
    expect(screen.queryByText('Tap to upload')).toBeNull();
  });

  it('Test 2: uploaded status renders an in_review disc and "In review" trailing text', async () => {
    const document = makeDocument('govt_id_front', { status: 'uploaded' });
    await render(
      <DocumentTile documentType="govt_id_front" document={document} onPress={jest.fn()} />,
    );

    expect(screen.getByTestId('status-disc-in_review')).toBeTruthy();
    expect(screen.getByText('In review')).toBeTruthy();
  });

  it('Test 3: approved status renders an approved disc, "Approved" text, and no action button', async () => {
    const document = makeDocument('govt_id_front', { status: 'approved' });
    await render(
      <DocumentTile documentType="govt_id_front" document={document} onPress={jest.fn()} />,
    );

    expect(screen.getByTestId('status-disc-approved')).toBeTruthy();
    expect(screen.getByText('Approved')).toBeTruthy();
    expect(screen.queryByText('Upload')).toBeNull();
    expect(screen.queryByText('Re-upload')).toBeNull();
  });

  it('Test 4: rejected status renders reason, disc, Re-upload button, and a danger-tinted row', async () => {
    const document = makeDocument('govt_id_front', {
      status: 'rejected',
      rejection_reason: 'Photo is blurry',
    });
    await render(
      <DocumentTile documentType="govt_id_front" document={document} onPress={jest.fn()} />,
    );

    expect(screen.getByTestId('status-disc-rejected')).toBeTruthy();
    expect(screen.getByText('Rejected — Photo is blurry')).toBeTruthy();
    expect(screen.getByText('Re-upload')).toBeTruthy();
    expect(screen.getByTestId('document-tile-row').props.className).toContain('bg-danger-50');
  });

  it('Test 5: rejected status without a reason falls back to "no reason provided"', async () => {
    const document = makeDocument('govt_id_front', {
      status: 'rejected',
      rejection_reason: undefined,
    });
    await render(
      <DocumentTile documentType="govt_id_front" document={document} onPress={jest.fn()} />,
    );

    expect(screen.getByText('Rejected — no reason provided')).toBeTruthy();
  });

  it('Test 6: pressing the row calls onPress once', async () => {
    const onPress = jest.fn();
    const document = makeDocument('govt_id_front', { status: 'approved' });
    await render(
      <DocumentTile documentType="govt_id_front" document={document} onPress={onPress} />,
    );

    fireEvent.press(screen.getByTestId('document-tile-row'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('Test 7: pressing the Upload button also calls onPress once', async () => {
    const onPress = jest.fn();
    await render(
      <DocumentTile documentType="govt_id_front" document={undefined} onPress={onPress} />,
    );

    fireEvent.press(screen.getByTestId('document-upload'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
