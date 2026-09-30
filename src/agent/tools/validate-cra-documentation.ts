import { z } from 'zod';
import { Money } from '@/domain/money/Money';
import { DocumentationRules, DocumentationTier, DocumentationStatus } from '@/domain/cra';

/**
 * Tool: Validate CRA Documentation
 * Validates whether a receipt has sufficient documentation for ITC claims
 * Uses deterministic CRA rules engine
 */

export const validateCraDocumentationTool = {
  description:
    'Validates CRA documentation requirements for a receipt based on amount and available information',
  inputSchema: z.object({
    receiptId: z.string().describe('The ID of the receipt to validate'),
    amount: z.number().describe('The total amount of the receipt'),
    vendorName: z.string().optional().describe('The vendor name from the receipt'),
    date: z.string().optional().describe('The date of the receipt'),
    gstNumber: z.string().optional().describe('The GST/HST registration number'),
    description: z.string().optional().describe('The description of goods/services'),
    customerInfo: z.string().optional().describe('Customer information (required for Tier 3)'),
  }),
  execute: async (input: {
    receiptId: string;
    amount: number;
    vendorName?: string;
    date?: string;
    gstNumber?: string;
    description?: string;
    customerInfo?: string;
  }): Promise<{
    receiptId: string;
    tier: DocumentationTier;
    status: DocumentationStatus;
    missingFields: string[];
    explanation: string;
    source: string;
  }> => {
    const amount = Money.fromNumber(input.amount);
    const result = DocumentationRules.validateDocumentation({
      amount,
      vendorName: input.vendorName,
      date: input.date,
      gstNumber: input.gstNumber,
      description: input.description,
      customerInfo: input.customerInfo,
    });

    return {
      receiptId: input.receiptId,
      tier: result.tier,
      status: result.status,
      missingFields: result.missingFields,
      explanation: DocumentationRules.getExplanation(result.tier, result.status),
      source: 'CRA_RULE_ENGINE',
    };
  },
};
