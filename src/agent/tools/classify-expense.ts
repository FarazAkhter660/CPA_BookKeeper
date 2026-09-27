import { z } from 'zod';
import { MealsRules } from '@/domain/cra';

/**
 * Tool: Classify Expense
 * Classifies an expense into a category and determines if it's subject to meal/entertainment rules
 */

export const classifyExpenseTool = {
  description:
    'Classifies an expense into a category and determines if meal/entertainment ITC restrictions apply',
  inputSchema: z.object({
    receiptId: z.string().describe('The ID of the receipt'),
    description: z.string().describe('The description of the expense'),
    vendor: z.string().describe('The vendor name'),
    proposedCategory: z.string().describe('The proposed expense category'),
  }),
  execute: async (input: {
    receiptId: string;
    description: string;
    vendor: string;
    proposedCategory: string;
  }): Promise<{
    receiptId: string;
    category: string;
    isMealOrEntertainment: boolean;
    itcPercentage: number;
    explanation: string;
    source: string;
  }> => {
    const isMealOrEntertainment = MealsRules.isMealOrEntertainment(input.proposedCategory);
    const itcPercentage = MealsRules.getITCPercentage(input.proposedCategory, 'standard');
    const explanation = MealsRules.getExplanation(input.proposedCategory, itcPercentage);

    return {
      receiptId: input.receiptId,
      category: input.proposedCategory,
      isMealOrEntertainment,
      itcPercentage,
      explanation,
      source: 'CRA_RULE_ENGINE',
    };
  },
};
