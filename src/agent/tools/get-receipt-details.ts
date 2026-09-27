import { z } from 'zod';
import { getDb } from '@/db';
import { Receipt } from '@/domain/expenses/types';

/**
 * Tool: Get Receipt Details
 * Returns detailed information about a specific receipt
 */

export const getReceiptDetailsTool = {
  description: 'Get detailed information about a specific receipt by ID',
  inputSchema: z.object({
    receiptId: z.string().describe('The ID of the receipt to retrieve'),
  }),
  execute: async (input: { receiptId: string }): Promise<{
    receipt: Receipt | null;
    message: string;
  }> => {
    const db = getDb();
    const receipt = db.getReceipt(input.receiptId);

    if (!receipt) {
      return {
        receipt: null,
        message: `Receipt with ID ${input.receiptId} not found.`,
      };
    }

    return {
      receipt,
      message: `Successfully retrieved receipt ${input.receiptId}`,
    };
  },
};
