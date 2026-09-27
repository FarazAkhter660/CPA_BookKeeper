import { Money } from '../money/Money';
import { TaxType, DocumentationStatus, ITCStatus } from '../cra/types';

/**
 * Receipt and expense types
 */

export enum ReceiptStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  REVIEW_REQUIRED = 'review_required',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ProcessingStage {
  IDLE = 'idle',
  READING = 'reading',
  VALIDATING = 'validating',
  CATEGORIZING = 'categorizing',
  CALCULATING = 'calculating',
  MAPPING = 'mapping',
  REVIEW = 'review',
  COMPLETE = 'complete',
  ERROR = 'error',
}

export interface Receipt {
  id: string;
  vendor: string;
  date: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  taxType: TaxType;
  gstNumber?: string;
  description?: string;
  category?: string;
  commercialUsePercentage: number;
  status: ReceiptStatus;
  processingStage?: ProcessingStage;
  receiptImage?: string;
  notes?: string;
  customerInfo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseAnalysis {
  receiptId: string;
  category: string;
  gifiCode: string;
  gifiDescription: string;
  gifiConfidence: number;
  eligibleITC: Money;
  grossTax: Money;
  eligibilityPercentage: number;
  documentationStatus: DocumentationStatus;
  documentationTier: string;
  itcStatus: ITCStatus;
  reason: string;
  ruleApplied: string;
  requiresApproval: boolean;
  confidence: 'high' | 'medium' | 'low';
  timestamp: string;
}

export interface ToolExecutionState {
  toolName: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: string;
  endTime?: string;
  result?: any;
  error?: string;
}

export interface ApprovalRequest {
  receiptId: string;
  proposedCategory: string;
  proposedGifiCode: string;
  proposedITC: Money;
  reason: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'modified';
}
