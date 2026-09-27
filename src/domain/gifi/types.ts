/**
 * GIFI (General Index of Financial Information) Types
 * CRA's standardized coding system for financial statement items
 */

export interface GIFICode {
  code: string;
  description: string;
  category: string;
  parentCategory: string;
  applicableExpenseTypes: string[];
  confidence: number;
  source: 'CRA_OFFICIAL';
}

export interface GIFIMappingResult {
  gifiCode: string;
  confidence: number;
  description: string;
  status: 'mapped' | 'review_required' | 'ambiguous' | 'not_found';
  reason?: string;
}

export enum GIFIStatus {
  VALID = 'valid',
  INVALID = 'invalid',
  REVIEW_REQUIRED = 'review_required',
}
