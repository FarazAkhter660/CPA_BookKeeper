import { z } from 'zod';
import { Money } from '@/domain/money/money';
import { ITCRules, TaxType, DocumentationStatus, DocumentationTier, ITCResult } from '@/domain/cra';

/**
 * Tool: Calculate Eligible ITC
 * Deterministically calculates the eligible GST/HST input tax credit
 * All calculations are performed by the rules engine, not the LLM
 */

export const calculateEligibleITCTool = {
  description:
    'Deterministically calculates the eligible Canadian GST/HST input tax credit based on CRA rules',
  inputSchema: z.object({
    receiptId: z.string().describe('The ID of the receipt'),
    subtotal: z.number().describe('The subtotal amount before tax'),
    taxAmount: z.number().describe('The GST/HST tax amount'),
    taxType: z.enum(['GST', 'HST']).describe('The type of tax (GST or HST)'),
    expenseCategory: z.string().describe('The category of the expense'),
    commercialUsePercentage: z
      .number()
      .min(0)
      .max(100)
      .describe('The percentage of commercial use (0-100)'),
    mealEntertainment: z
      .boolean()
      .describe('Whether this is a meal or entertainment expense'),
    documentationStatus: z
      .enum(['sufficient', 'insufficient', 'review_required'])
      .describe('The documentation status'),
    documentationTier: z
      .enum(['TIER_1', 'TIER_2', 'TIER_3'])
      .describe('The documentation tier'),
    mealPolicyType: z
      .enum(['standard', 'charity', 'truckDriver'])
      .optional()
      .describe('The meal policy type if applicable'),
  }),
  execute: async (input: {
    receiptId: string;
    subtotal: number;
    taxAmount: number;
    taxType: TaxType;
    expenseCategory: string;
    commercialUsePercentage: number;
    mealEntertainment: boolean;
    documentationStatus: DocumentationStatus;
    documentationTier: DocumentationTier;
    mealPolicyType?: 'standard' | 'charity' | 'truckDriver';
  }): Promise<{
    receiptId: string;
    result: ITCResult;
    explanation: string;
    source: string;
  }> => {
    const subtotal = Money.fromNumber(input.subtotal);
    const taxAmount = Money.fromNumber(input.taxAmount);

    const result = ITCRules.calculateEligibleITC({
      subtotal,
      taxAmount,
      taxType: input.taxType,
      expenseCategory: input.expenseCategory,
      commercialUsePercentage: input.commercialUsePercentage,
      mealEntertainment: input.mealEntertainment,
      documentationStatus: input.documentationStatus,
      documentationTier: input.documentationTier,
      mealPolicyType: input.mealPolicyType,
    });

    // Validate the result
    const validation = ITCRules.validateResult(result);
    if (!validation.valid) {
      throw new Error(`ITC calculation validation failed: ${validation.errors.join(', ')}`);
    }

    return {
      receiptId: input.receiptId,
      result,
      explanation: ITCRules.getExplanation(result),
      source: 'CRA_RULE_ENGINE',
    };
  },
};
