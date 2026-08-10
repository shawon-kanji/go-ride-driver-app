import { fireEvent, render, screen } from '@testing-library/react-native';

import { ReuploadConfirmDialog } from './ReuploadConfirmDialog';

describe('ReuploadConfirmDialog', () => {
  it('names the document type in the re-review warning when visible', async () => {
    await render(
      <ReuploadConfirmDialog
        visible
        documentType="govt_id_front"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByText(/Government ID \(front\)/)).toBeTruthy();
    expect(screen.getByText(/reviewed again/)).toBeTruthy();
  });

  it('renders nothing when not visible', async () => {
    await render(
      <ReuploadConfirmDialog
        visible={false}
        documentType="govt_id_front"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.queryByText(/reviewed again/)).toBeNull();
  });

  it('calls onConfirm when the confirm action is pressed', async () => {
    const onConfirm = jest.fn();
    await render(
      <ReuploadConfirmDialog
        visible
        documentType="govt_id_front"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByText('Replace'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when the cancel action is pressed', async () => {
    const onCancel = jest.fn();
    await render(
      <ReuploadConfirmDialog
        visible
        documentType="govt_id_front"
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.press(screen.getByText('Cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
