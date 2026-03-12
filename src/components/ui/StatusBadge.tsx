import { CheckCircle, XCircle } from 'lucide-react';

type Status = 'Enabled' | 'Disabled' | string;

export default function StatusBadge({ status }: { status: Status }) {
  const isEnabled = status === 'Enabled';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
      isEnabled
        ? 'bg-success-bg text-success-text'
        : 'bg-danger-bg text-danger-text'
    }`}>
      {isEnabled ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {status}
    </span>
  );
}
