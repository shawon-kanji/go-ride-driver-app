import { ConfirmDialog } from '../../../components/ConfirmDialog';
import type { DocumentType } from '../../../api/types';
import { DOCUMENT_TYPE_LABELS } from '../schemas';

interface ReuploadConfirmDialogProps {
  visible: boolean;
  documentType: DocumentType;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Shown only when replacing an already-APPROVED document. go-ride-backend
 * supersedes the prior row on confirm (is_current=false) and the new upload
 * starts back at 'uploaded', which pulls driver kyc_status back to in_review
 * for identity documents — so the driver needs to be told before, not after.
 */
export function ReuploadConfirmDialog({
  visible,
  documentType,
  onConfirm,
  onCancel,
  loading = false,
}: ReuploadConfirmDialogProps) {
  return (
    <ConfirmDialog
      visible={visible}
      title="Replace approved document"
      message={`Your ${DOCUMENT_TYPE_LABELS[documentType]} is already approved. Replacing it means it will need to be reviewed again. Continue?`}
      confirmLabel="Replace"
      cancelLabel="Cancel"
      onConfirm={onConfirm}
      onCancel={onCancel}
      loading={loading}
    />
  );
}
