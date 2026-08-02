import { ConfirmDialog } from '../../../components/ConfirmDialog';
import type { Vehicle } from '../../../api/types';

interface ActivateConfirmDialogProps {
  visible: boolean;
  target: Vehicle;
  currentlyActive: Vehicle | undefined;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export function ActivateConfirmDialog({
  visible,
  target,
  currentlyActive,
  onConfirm,
  onCancel,
  loading,
}: ActivateConfirmDialogProps) {
  const message = currentlyActive
    ? `Activating ${target.model_name} (${target.plate_number}) will deactivate ${currentlyActive.model_name} (${currentlyActive.plate_number}) — continue?`
    : `Activate ${target.model_name} (${target.plate_number})?`;

  return (
    <ConfirmDialog
      visible={visible}
      title="Activate vehicle"
      message={message}
      confirmLabel="Activate"
      onConfirm={onConfirm}
      onCancel={onCancel}
      loading={loading}
    />
  );
}
