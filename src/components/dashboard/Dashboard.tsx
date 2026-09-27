'use client';

import ReceiptQueue from './ReceiptQueue';
import ReceiptDetails from './ReceiptDetails';
import AICopilot from '../copilot/AICopilot';
import { useStateContext } from '@/components/providers/state-provider';

export default function Dashboard() {
  const { state } = useStateContext();
  const selectedReceipt = state.selectedReceiptId 
    ? state.receipts.find(r => r.id === state.selectedReceiptId) || null
    : null;

  return (
    <div className="flex h-screen bg-background">
      <ReceiptQueue />
      <ReceiptDetails />
      <AICopilot 
        selectedReceiptId={state.selectedReceiptId}
        selectedReceipt={selectedReceipt}
      />
    </div>
  );
}
