/**
 * Agent Tools
 * Strict tool schemas with Zod validation
 * All tools call deterministic business logic - LLM never performs calculations
 */

export * from './get-current-receipt';
export * from './get-receipt-details';
export * from './validate-cra-documentation';
export * from './validate-gst-hst-number';
export * from './calculate-eligible-itc';
export * from './classify-expense';
export * from './assign-gifi-code';
export * from './update-expense-classification';
export * from './request-human-review';
export * from './get-processing-status';

// Simple wrapper functions for API route usage
import { MOCK_RECEIPTS } from '@/domain/expenses/mock-receipts';
import { Money } from '@/domain/money/money';
import { DocumentationRules, ITCRules, MealsRules, GIFIMapper } from '@/domain/cra';

export async function readCurrentReceipt({ receiptId }: { receiptId: string }) {
  const receipt = MOCK_RECEIPTS.find(r => r.id === receiptId);
  if (!receipt) {
    throw new Error('Receipt not found');
  }
  return receipt;
}

export async function validateCRADocumentation({ receiptId }: { receiptId: string }) {
  const receipt = MOCK_RECEIPTS.find(r => r.id === receiptId);
  if (!receipt) {
    throw new Error('Receipt not found');
  }
  
  const result = DocumentationRules.validateDocumentation({
    amount: new Money(receipt.total),
    vendorName: receipt.vendor,
    date: receipt.date,
    gstNumber: receipt.gstNumber,
    description: receipt.description,
  });
  
  return {
    receiptId,
    tier: result.tier,
    status: result.status,
    missingFields: result.missingFields,
    explanation: DocumentationRules.getExplanation(result.tier, result.status),
  };
}

export async function calculateEligibleITC({ receiptId }: { receiptId: string }) {
  const receipt = MOCK_RECEIPTS.find(r => r.id === receiptId);
  if (!receipt) {
    throw new Error('Receipt not found');
  }
  
  const docResult = DocumentationRules.validateDocumentation({
    amount: new Money(receipt.total),
    vendorName: receipt.vendor,
    date: receipt.date,
    gstNumber: receipt.gstNumber,
    description: receipt.description,
  });
  
  const result = ITCRules.calculateEligibleITC({
    subtotal: new Money(receipt.subtotal),
    taxAmount: new Money(receipt.taxAmount),
    taxType: receipt.taxType as any,
    expenseCategory: receipt.category || 'Office Supplies',
    commercialUsePercentage: receipt.commercialUsePercentage,
    mealEntertainment: receipt.category?.toLowerCase().includes('meal') || false,
    documentationStatus: docResult.status,
    documentationTier: docResult.tier,
  });
  
  return {
    receiptId,
    eligibleITC: result.eligibleITC.toNumber(),
    eligibilityPercentage: result.eligibilityPercentage,
    status: result.status,
    ruleApplied: result.ruleApplied,
  };
}

export async function classifyExpense({ receiptId }: { receiptId: string }) {
  const receipt = MOCK_RECEIPTS.find(r => r.id === receiptId);
  if (!receipt) {
    throw new Error('Receipt not found');
  }
  
  const category = receipt.category || 'Office Supplies';
  const isMealOrEntertainment = MealsRules.isMealOrEntertainment(category);
  const itcPercentage = MealsRules.getITCPercentage(category, 'standard');
  
  return {
    receiptId,
    category,
    isMealOrEntertainment,
    itcPercentage,
  };
}

export async function assignGIFICode({ receiptId }: { receiptId: string }) {
  const receipt = MOCK_RECEIPTS.find(r => r.id === receiptId);
  if (!receipt) {
    throw new Error('Receipt not found');
  }
  
  const mapping = GIFIMapper.mapToGIFI(receipt.description || receipt.category || 'Office Supplies');
  
  return {
    receiptId,
    gifiCode: mapping.gifiCode,
    description: mapping.description,
    status: mapping.status,
  };
}
