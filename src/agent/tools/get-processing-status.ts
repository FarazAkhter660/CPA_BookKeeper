import { z } from 'zod';
import { getDb } from '@/db';
import { ToolExecutionState } from '@/domain/expenses/types';

/**
 * Tool: Get Processing Status
 * Returns the current processing status and tool execution history for a receipt
 */

export const getProcessingStatusTool = {
  description:
    'Returns the current processing status and tool execution history for a specific receipt',
  inputSchema: z.object({
    receiptId: z.string().describe('The ID of the receipt'),
  }),
  execute: async (input: {
    receiptId: string;
  }): Promise<{
    receiptId: string;
    receipt: any;
    toolExecutions: ToolExecutionState[];
    expenseAnalysis?: any;
    approvalRequest?: any;
  }> => {
    const db = getDb();
    const receipt = db.getReceipt(input.receiptId);
    const toolExecutions = db.getToolExecutions(input.receiptId);
    const expenseAnalysis = db.getExpense(input.receiptId);
    const approvalRequest = db.getApproval(input.receiptId);

    return {
      receiptId: input.receiptId,
      receipt,
      toolExecutions,
      expenseAnalysis,
      approvalRequest,
    };
  },
};
