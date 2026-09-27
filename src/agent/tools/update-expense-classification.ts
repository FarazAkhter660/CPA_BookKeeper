import { z } from 'zod';
import { getDb } from '@/db';
import { ReceiptStatus, ProcessingStage } from '@/domain/expenses/types';
import { ExpenseAnalysis } from '@/domain/expenses/types';
import { Money } from '@/domain/money/Money';
import { DocumentationStatus, ITCStatus } from '@/domain/cra/types';

/**
 * Tool: Update Expense Classification
 * Updates the receipt with the expense classification and analysis results
 * This is a state mutation that requires authorization
 */

export const updateExpenseClassificationTool = {
  description:
    'Updates the receipt with expense classification, GIFI code, and ITC calculation results. This modifies application state.',
  inputSchema: z.object({
    receiptId: z.string().describe('The ID of the receipt'),
    category: z.string().describe('The expense category'),
    gifiCode: z.string().describe('The assigned GIFI code'),
    gifiDescription: z.string().describe('The GIFI code description'),
    gifiConfidence: z.number().min(0).max(1).describe('Confidence score for GIFI mapping'),
    eligibleITC: z.number().describe('The eligible ITC amount'),
    grossTax: z.number().describe('The gross tax amount'),
    eligibilityPercentage: z.number().min(0).max(1).describe('The eligibility percentage'),
    documentationStatus: z
      .enum(['sufficient', 'insufficient', 'review_required'])
      .describe('Documentation status'),
    documentationTier: z
      .enum(['TIER_1', 'TIER_2', 'TIER_3'])
      .describe('Documentation tier'),
    itcStatus: z
      .enum(['eligible', 'partial', 'ineligible', 'review'])
      .describe('ITC status'),
    reason: z.string().describe('Explanation for the classification'),
    ruleApplied: z.string().describe('The rule that was applied'),
    requiresApproval: z.boolean().describe('Whether human approval is required'),
    confidence: z.enum(['high', 'medium', 'low']).describe('Overall confidence level'),
  }),
  execute: async (input: {
    receiptId: string;
    category: string;
    gifiCode: string;
    gifiDescription: string;
    gifiConfidence: number;
    eligibleITC: number;
    grossTax: number;
    eligibilityPercentage: number;
    documentationStatus: 'sufficient' | 'insufficient' | 'review_required';
    documentationTier: 'TIER_1' | 'TIER_2' | 'TIER_3';
    itcStatus: 'eligible' | 'partial' | 'ineligible' | 'review';
    reason: string;
    ruleApplied: string;
    requiresApproval: boolean;
    confidence: 'high' | 'medium' | 'low';
  }): Promise<{
    receiptId: string;
    success: boolean;
    message: string;
    updatedReceipt?: any;
  }> => {
    const db = getDb();

    // Update receipt status
    const updatedReceipt = db.updateReceipt(input.receiptId, {
      category: input.category,
      status: input.requiresApproval ? ReceiptStatus.REVIEW_REQUIRED : ReceiptStatus.PROCESSED,
      processingStage: ProcessingStage.COMPLETE,
    });

    if (!updatedReceipt) {
      return {
        receiptId: input.receiptId,
        success: false,
        message: `Receipt ${input.receiptId} not found`,
      };
    }

    // Save expense analysis
    const expenseAnalysis: ExpenseAnalysis = {
      receiptId: input.receiptId,
      category: input.category,
      gifiCode: input.gifiCode,
      gifiDescription: input.gifiDescription,
      gifiConfidence: input.gifiConfidence,
      eligibleITC: Money.fromNumber(input.eligibleITC),
      grossTax: Money.fromNumber(input.grossTax),
      eligibilityPercentage: input.eligibilityPercentage,
      documentationStatus: input.documentationStatus as DocumentationStatus,
      documentationTier: input.documentationTier,
      itcStatus: input.itcStatus as ITCStatus,
      reason: input.reason,
      ruleApplied: input.ruleApplied,
      requiresApproval: input.requiresApproval,
      confidence: input.confidence,
      timestamp: new Date().toISOString(),
    };

    db.saveExpense(expenseAnalysis);

    return {
      receiptId: input.receiptId,
      success: true,
      message: `Successfully updated receipt ${input.receiptId} with classification`,
      updatedReceipt,
    };
  },
};
