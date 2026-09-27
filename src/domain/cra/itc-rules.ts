import {
  ITCResult,
  ITCStatus,
  DocumentationStatus,
  DocumentationTier,
  TaxType,
  MealITCPolicy,
} from './types';
import { Money } from '../money/money';
import { DocumentationRules } from './documentation-rules';

/**
 * CRA Input Tax Credit (ITC) Calculation Engine
 * Based on GST/HST Memorandum 3.2 - Input Tax Credits
 * https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/gst-hst-memo/gst-hst-memo-3-2.html
 */

export class ITCRules {
  /**
   * Default meal/entertainment ITC policy
   */
  private static readonly DEFAULT_MEAL_POLICY: MealITCPolicy = {
    standard: 0.5,
    charityOrPublicInstitution: 1.0,
    longHaulTruckDriver: 0.8,
  };

  /**
   * Calculate eligible ITC deterministically
   */
  static calculateEligibleITC(params: {
    subtotal: Money;
    taxAmount: Money;
    taxType: TaxType;
    expenseCategory: string;
    commercialUsePercentage: number;
    mealEntertainment: boolean;
    documentationStatus: DocumentationStatus;
    documentationTier: DocumentationTier;
    mealPolicyType?: 'standard' | 'charity' | 'truckDriver';
  }): ITCResult {
    const {
      subtotal,
      taxAmount,
      taxType,
      expenseCategory,
      commercialUsePercentage,
      mealEntertainment,
      documentationStatus,
      documentationTier,
      mealPolicyType = 'standard',
    } = params;

    // Validate inputs
    if (commercialUsePercentage < 0 || commercialUsePercentage > 100) {
      throw new Error('Commercial use percentage must be between 0 and 100');
    }

    if (taxAmount.isNegative()) {
      throw new Error('Tax amount cannot be negative');
    }

    // Start with gross tax
    const grossTax = taxAmount;

    // Apply commercial use percentage
    let eligibilityPercentage = commercialUsePercentage / 100;

    // Apply meal/entertainment restriction if applicable
    let ruleApplied = 'STANDARD_ITC';
    let reasonCode = 'FULL_ELIGIBILITY';

    if (mealEntertainment) {
      const policy = this.DEFAULT_MEAL_POLICY;
      let mealRestriction = policy.standard;

      if (mealPolicyType === 'charity') {
        mealRestriction = policy.charityOrPublicInstitution;
        ruleApplied = 'MEAL_CHARITY_EXCEPTION';
      } else if (mealPolicyType === 'truckDriver') {
        mealRestriction = policy.longHaulTruckDriver;
        ruleApplied = 'MEAL_TRUCK_DRIVER_EXCEPTION';
      } else {
        ruleApplied = 'MEAL_ENTERTAINMENT_RESTRICTION';
      }

      eligibilityPercentage = eligibilityPercentage * mealRestriction;
      reasonCode = 'MEAL_ENTERTAINMENT_50_PERCENT';
    }

    // Check documentation status
    if (documentationStatus === DocumentationStatus.INSUFFICIENT) {
      return {
        grossTax,
        eligibilityPercentage: 0,
        eligibleITC: Money.zero(),
        reasonCode: 'INSUFFICIENT_DOCUMENTATION',
        status: ITCStatus.INELIGIBLE,
        ruleApplied: 'DOCUMENTATION_REQUIREMENT',
        documentation: {
          tier: documentationTier,
          status: documentationStatus,
        },
      };
    }

    if (documentationStatus === DocumentationStatus.REVIEW_REQUIRED) {
      return {
        grossTax,
        eligibilityPercentage,
        eligibleITC: Money.zero(),
        reasonCode: 'DOCUMENTATION_REVIEW_REQUIRED',
        status: ITCStatus.REVIEW,
        ruleApplied: 'DOCUMENTATION_REVIEW',
        documentation: {
          tier: documentationTier,
          status: documentationStatus,
        },
      };
    }

    // Calculate eligible ITC
    let eligibleITC = grossTax.multiply(eligibilityPercentage);

    // Round to nearest cent
    eligibleITC = eligibleITC.roundToCents();

    // Determine final status
    let status: ITCStatus;
    if (eligibleITC.isZero()) {
      status = ITCStatus.INELIGIBLE;
      reasonCode = 'NO_ELIGIBLE_AMOUNT';
    } else if (eligibilityPercentage < 1) {
      status = ITCStatus.PARTIAL;
    } else {
      status = ITCStatus.ELIGIBLE;
    }

    return {
      grossTax,
      eligibilityPercentage,
      eligibleITC,
      reasonCode,
      status,
      ruleApplied,
      documentation: {
        tier: documentationTier,
        status: documentationStatus,
      },
    };
  }

  /**
   * Get explanation for ITC calculation
   */
  static getExplanation(result: ITCResult): string {
    const parts: string[] = [];

    parts.push(`GST/HST paid: ${result.grossTax.formatCAD()}`);

    if (result.eligibilityPercentage < 1) {
      parts.push(
        `Applicable ITC percentage: ${(result.eligibilityPercentage * 100).toFixed(0)}%`
      );
    }

    parts.push(`Eligible ITC: ${result.eligibleITC.formatCAD()}`);

    const reasonMap: Record<string, string> = {
      FULL_ELIGIBILITY: 'Full ITC eligibility based on commercial use.',
      MEAL_ENTERTAINMENT_50_PERCENT:
        'Business meals are generally subject to the 50% ITC limitation.',
      MEAL_CHARITY_EXCEPTION:
        'Full ITC allowed for meals provided by charities or public institutions.',
      MEAL_TRUCK_DRIVER_EXCEPTION:
        '80% ITC allowed for long-haul truck driver meals.',
      INSUFFICIENT_DOCUMENTATION:
        'ITC cannot be claimed due to insufficient documentation.',
      DOCUMENTATION_REVIEW_REQUIRED:
        'Additional documentation review required before ITC can be claimed.',
      NO_ELIGIBLE_AMOUNT: 'No eligible ITC amount based on applied rules.',
    };

    parts.push(`Reason: ${reasonMap[result.reasonCode] || result.reasonCode}`);

    return parts.join('\n');
  }

  /**
   * Validate ITC calculation result
   */
  static validateResult(result: ITCResult): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check that eligible ITC is not greater than gross tax
    if (result.eligibleITC.isGreaterThan(result.grossTax)) {
      errors.push('Eligible ITC cannot exceed gross tax');
    }

    // Check that eligible ITC is not negative
    if (result.eligibleITC.isNegative()) {
      errors.push('Eligible ITC cannot be negative');
    }

    // Check that eligibility percentage is between 0 and 1
    if (result.eligibilityPercentage < 0 || result.eligibilityPercentage > 1) {
      errors.push('Eligibility percentage must be between 0 and 1');
    }

    // Check that gross tax is not negative
    if (result.grossTax.isNegative()) {
      errors.push('Gross tax cannot be negative');
    }

    // Check status consistency
    if (result.status === ITCStatus.ELIGIBLE && result.eligibleITC.isZero()) {
      errors.push('ELIGIBLE status requires non-zero eligible ITC');
    }

    if (result.status === ITCStatus.INELIGIBLE && !result.eligibleITC.isZero()) {
      errors.push('INELIGIBLE status requires zero eligible ITC');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
