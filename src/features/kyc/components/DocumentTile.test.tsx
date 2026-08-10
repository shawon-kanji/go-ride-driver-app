import { fireEvent, render, screen } from '@testing-library/react-native';

import { DocumentTile } from './DocumentTile';
import { makeDocument } from '../../../test-utils/kyc-fixtures';

describe('DocumentTile', () => {
  it('renders an upload CTA and Not uploaded badge when no document exists', async () => {
    await render(
      <DocumentTile documentType="govt_id_front" document={undefined} onPress={jest.fn()} />,
    );

    expect(screen.getByText('Government ID (front)')).toBeTruthy();
    expect(screen.getByText('Not uploaded')).toBeTruthy();
    expect(screen.getByText('Tap to upload')).toBeTruthy();
  });

  it('renders an In review badge when the document status is uploaded', async () => {
    const document = makeDocument('govt_id_front', { status: 'uploaded' });
    await render(
      <DocumentTile documentType="govt_id_front" document={document} onPress={jest.fn()} />,
    );

    expect(screen.getByText('In review')).toBeTruthy();
  });

  it('renders an Approved badge when the document status is approved', async () => {
    const document = makeDocument('govt_id_front', { status: 'approved' });
    await render(
      <DocumentTile documentType="govt_id_front" document={document} onPress={jest.fn()} />,
    );

    expect(screen.getByText('Approved')).toBeTruthy();
  });

  it('renders a Rejected badge with the rejection reason when the document status is rejected', async () => {
    const document = makeDocument('govt_id_front', {
      status: 'rejected',
      rejection_reason: 'Photo is blurry',
    });
    const { rerender } = await render(
      <DocumentTile documentType="govt_id_front" document={document} onPress={jest.fn()} />,
    );

    expect(screen.getByText('Rejected')).toBeTruthy();
    expect(screen.getByText('Photo is blurry')).toBeTruthy();

    const documentWithoutReason = makeDocument('govt_id_front', {
      status: 'rejected',
      rejection_reason: undefined,
    });
    await rerender(
      <DocumentTile
        documentType="govt_id_front"
        document={documentWithoutReason}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('No reason provided')).toBeTruthy();
  });

  it('calls onPress when the tile is pressed', async () => {
    const onPress = jest.fn();
    const document = makeDocument('govt_id_front', { status: 'approved' });
    await render(
      <DocumentTile documentType="govt_id_front" document={document} onPress={onPress} />,
    );

    fireEvent.press(screen.getByText('Government ID (front)'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
