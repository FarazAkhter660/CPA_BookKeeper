'use client';

import { Receipt, ReceiptStatus } from '@/domain/expenses/types';
import { cn } from '@/lib/utils';
import { useStateContext } from '@/components/providers/state-provider';

export default function ReceiptQueue() {
  const { state, selectReceipt } = useStateContext();

  const getStatusColor = (status: ReceiptStatus) => {
    switch (status) {
      case ReceiptStatus.PENDING:
        return 'text-yellow-500';
      case ReceiptStatus.PROCESSED:
        return 'text-green-500';
      case ReceiptStatus.REVIEW_REQUIRED:
        return 'text-orange-500';
      case ReceiptStatus.APPROVED:
        return 'text-green-500';
      case ReceiptStatus.REJECTED:
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: ReceiptStatus) => {
    switch (status) {
      case ReceiptStatus.PENDING:
        return '●';
      case ReceiptStatus.PROCESSED:
        return '✓';
      case ReceiptStatus.REVIEW_REQUIRED:
        return '⚠';
      default:
        return '○';
    }
  };

  const pendingCount = state.receipts.filter(r => r.status === ReceiptStatus.PENDING).length;
  const processedCount = state.receipts.filter(r => r.status === ReceiptStatus.PROCESSED).length;
  const reviewCount = state.receipts.filter(r => r.status === ReceiptStatus.REVIEW_REQUIRED).length;

  return (
    <div className="w-80 border-r border-border flex flex-col bg-card">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold mb-3">Queue</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">● Pending</span>
            <span>{pendingCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">✓ Processed</span>
            <span>{processedCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">⚠ Review</span>
            <span>{reviewCount}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {state.receipts.map((receipt) => (
          <button
            key={receipt.id}
            onClick={() => selectReceipt(receipt.id)}
            className={cn(
              'w-full p-4 text-left border-b border-border hover:bg-accent transition-colors',
              state.selectedReceiptId === receipt.id && 'bg-accent border-l-2 border-l-primary'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={getStatusColor(receipt.status)}>{getStatusIcon(receipt.status)}</span>
              <span className="text-sm font-medium">{receipt.id}</span>
            </div>
            <div className="text-xs text-muted-foreground truncate">{receipt.vendor}</div>
            <div className="text-xs text-muted-foreground">${receipt.total.toFixed(2)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
