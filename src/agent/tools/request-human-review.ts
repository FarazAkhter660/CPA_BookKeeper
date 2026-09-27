import { z } from 'zod';
import { getDb } from '@/db';
import { ApprovalRequest } from '@/domain/expenses/types';
import { Money } from '@/domain/money/Money';

/**
 * Tool: Request Human Review
 * Creates an approval request for human review when the agent is uncertain or rules require approval
 */

export const requestHumanReviewTool = {
  description:
    'Requests human review for a receipt when classification is uncertain or requires approval per business rules',
  inputSchema: z.object({
    receiptId: z.string().describe('The ID of the receipt'),
    proposedCategory: z.string().describe('The proposed expense category'),
    proposedGifiCode: z.string().describe('The proposed GIFI code'),
    proposedITC: z.number().describe('The proposed eligible ITC amount'),
    reason: z.string().describe('The reason why human review is required'),
  }),
  execute: async (input: {
    receiptId: string;
    proposedCategory: string;
    proposedGifiCode: string;
    proposedITC: number;
    reason: string;
  }): Promise<{
    receiptId: string;
    approvalRequest: ApprovalRequest;
    message: string;
  }> => {
    const db = getDb();

    const approvalRequest: ApprovalRequest = {
      receiptId: input.receiptId,
      proposedCategory: input.proposedCategory,
      proposedGifiCode: input.proposedGifiCode,
      proposedITC: Money.fromNumber(input.proposedITC),
      reason: input.reason,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };

    db.saveApproval(approvalRequest);

    return {
      receiptId: input.receiptId,
      approvalRequest,
      message: `Human review requested for receipt ${input.receiptId}`,
    };
  },
};
