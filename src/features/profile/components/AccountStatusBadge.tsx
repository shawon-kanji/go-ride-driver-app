import { Badge } from '../../../components/Badge';
import type { AccountStatus } from '../../../api/types';

const LABELS: Record<AccountStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  blocked: 'Blocked',
};

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  return <Badge label={LABELS[status]} variant={status} />;
}
