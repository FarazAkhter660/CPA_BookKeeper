import { z } from 'zod';
import { MOCK_RECEIPTS } from '@/domain/expenses/mock-receipts';
import { Receipt } from '@/domain/expenses/types';

/**
 * Tool: Get Current Receipt
 * Returns the currently selected receipt from application state
 */

export const getCurrentReceiptTool = {
  description: 'Get the currently selected receipt from the application state',
  inputSchema: z.object({
    selectedReceiptId: z.string().optional().describe('The ID of the currently selected receipt'),
  }),
  execute: async (input: { selectedReceiptId?: string }): Promise<{
    receipt: Receipt | null;
    message: string;
  }> => {
    if (!input.selectedReceiptId) {
      return {
        receipt: null,
        message: 'No receipt is currently selected. Please select a receipt first.',
      };
    }

    const receipt = MOCK_RECEIPTS.find(r => r.id === input.selectedReceiptId);

    if (!receipt) {
      return {
        receipt: null,
        message: `Receipt with ID ${input.selectedReceiptId} not found.`,
      };
    }

    return {
      receipt,
      message: `Successfully retrieved receipt ${input.selectedReceiptId}`,
    };
  },
};
