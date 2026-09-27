import { MealITCPolicy } from './types';

/**
 * CRA Meals & Entertainment ITC Rules
 * Based on GST/HST Memorandum 3.3 - Input Tax Credits - Restrictions
 * https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/gst-hst-memo/gst-hst-memo-3-3.html
 */

export class MealsRules {
  /**
   * Standard meal/entertainment ITC policy
   */
  static readonly STANDARD_POLICY: MealITCPolicy = {
    standard: 0.5,
    charityOrPublicInstitution: 1.0,
    longHaulTruckDriver: 0.8,
  };

  /**
   * Determine if an expense category is subject to meal/entertainment restrictions
   */
  static isMealOrEntertainment(category: string): boolean {
    const mealCategories = [
      'meals',
      'entertainment',
      'food',
      'restaurant',
      'catering',
      'hospitality',
      'business meal',
      'client entertainment',
    ];

    const lowerCategory = category.toLowerCase();
    return mealCategories.some((mc) => lowerCategory.includes(mc));
  }

  /**
   * Get the applicable ITC percentage for meals/entertainment
   */
  static getITCPercentage(
    category: string,
    policyType: 'standard' | 'charity' | 'truckDriver' = 'standard'
  ): number {
    if (!this.isMealOrEntertainment(category)) {
      return 1.0; // Full ITC for non-meal expenses
    }

    const policy = this.STANDARD_POLICY;

    switch (policyType) {
      case 'charity':
        return policy.charityOrPublicInstitution;
      case 'truckDriver':
        return policy.longHaulTruckDriver;
      default:
        return policy.standard;
    }
  }

  /**
   * Get explanation for meal/entertainment ITC restriction
   */
  static getExplanation(category: string, percentage: number): string {
    if (!this.isMealOrEntertainment(category)) {
      return 'Full ITC eligibility - not a meal or entertainment expense.';
    }

    const explanations: Record<number, string> = {
      1.0: 'Full ITC allowed - exception applies (charity or public institution).',
      0.8: '80% ITC allowed - long-haul truck driver exception.',
      0.5: '50% ITC allowed - standard meal/entertainment restriction applies.',
    };

    return explanations[percentage] || `${(percentage * 100).toFixed(0)}% ITC allowed.`;
  }

  /**
   * Check if a specific exception applies
   */
  static hasException(category: string, exceptionType: string): boolean {
    if (!this.isMealOrEntertainment(category)) {
      return false;
    }

    const exceptions = {
      charity: ['charity', 'non-profit', 'public institution'],
      truckDriver: ['truck driver', 'long-haul', 'transportation'],
    };

    const lowerCategory = category.toLowerCase();
    const exceptionKeywords = exceptions[exceptionType as keyof typeof exceptions] || [];

    return exceptionKeywords.some((keyword) => lowerCategory.includes(keyword));
  }
}
