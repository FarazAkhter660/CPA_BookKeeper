import { Money } from '../money/Money';

/**
 * CRA Documentation Tiers based on transaction amount
 * Based on CRA GST/HST Memorandum 1.4
 */
export enum DocumentationTier {
  TIER_1 = 'TIER_1', // < $30
  TIER_2 = 'TIER_2', // $30 to < $150
  TIER_3 = 'TIER_3', // $150 or more
}

/**
 * Documentation status for a receipt
 */
export enum DocumentationStatus {
  SUFFICIENT = 'sufficient',
  INSUFFICIENT = 'insufficient',
  REVIEW_REQUIRED = 'review_required',
}

/**
 * Tax type
 */
export enum TaxType {
  GST = 'GST',
  HST = 'HST',
}

/**
 * GST/HST registration number validation status
 */
export enum GstNumberStatus {
  VALID_FORMAT = 'valid_format',
  INVALID_FORMAT = 'invalid_format',
  MISSING = 'missing',
  MALFORMED = 'malformed',
  SUSPICIOUS = 'suspicious',
  UNAVAILABLE = 'unavailable',
}

/**
 * ITC eligibility status
 */
export enum ITCStatus {
  ELIGIBLE = 'eligible',
  PARTIAL = 'partial',
  INELIGIBLE = 'ineligible',
  REVIEW = 'review',
}

/**
 * Documentation requirements per tier
 */
export interface DocumentationRequirements {
  tier: DocumentationTier;
  requiresVendorName: boolean;
  requiresDate: boolean;
  requiresAmount: boolean;
  requiresGstNumber: boolean;
  requiresDescription: boolean;
  requiresCustomerInfo: boolean;
  minAmount: number;
  maxAmount: number | null;
}

/**
 * GST/HST number validation result
 */
export interface GstNumberValidation {
  status: GstNumberStatus;
  number: string | null;
  isValidFormat: boolean;
  reason: string;
}

/**
 * ITC calculation result
 */
export interface ITCResult {
  grossTax: Money;
  eligibilityPercentage: number;
  eligibleITC: Money;
  reasonCode: string;
  status: ITCStatus;
  ruleApplied: string;
  documentation: {
    tier: DocumentationTier;
    status: DocumentationStatus;
  };
}

/**
 * Meal/entertainment ITC policy
 */
export interface MealITCPolicy {
  standard: number; // 0.50 for most businesses
  charityOrPublicInstitution: number; // 1.00
  longHaulTruckDriver: number; // 0.80
}

/**
 * Compliance source reference
 */
export interface ComplianceSource {
  id: string;
  authority: 'CRA';
  title: string;
  url: string;
  retrievedAt?: string;
  ruleVersion: string;
}

/**
 * Rule version for tracking
 */
export const CRA_RULESET_VERSION = '2026.09.1';
