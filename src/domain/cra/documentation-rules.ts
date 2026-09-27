import {
  DocumentationTier,
  DocumentationStatus,
  DocumentationRequirements,
} from './types';
import { Money } from '../money/money';

/**
 * CRA Documentation Rules Engine
 * Based on GST/HST Memorandum 1.4 - Supporting Documentation
 * https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/gst-hst-memo/gst-hst-memo-1-4.html
 */

export class DocumentationRules {
  /**
   * Determine documentation tier based on amount
   */
  static getTier(amount: Money): DocumentationTier {
    const amountValue = amount.toNumber();

    if (amountValue < 30) {
      return DocumentationTier.TIER_1;
    } else if (amountValue < 150) {
      return DocumentationTier.TIER_2;
    } else {
      return DocumentationTier.TIER_3;
    }
  }

  /**
   * Get documentation requirements for a given tier
   */
  static getRequirements(tier: DocumentationTier): DocumentationRequirements {
    const requirements: Record<DocumentationTier, DocumentationRequirements> = {
      [DocumentationTier.TIER_1]: {
        tier: DocumentationTier.TIER_1,
        requiresVendorName: true,
        requiresDate: true,
        requiresAmount: true,
        requiresGstNumber: false,
        requiresDescription: false,
        requiresCustomerInfo: false,
        minAmount: 0,
        maxAmount: 29.99,
      },
      [DocumentationTier.TIER_2]: {
        tier: DocumentationTier.TIER_2,
        requiresVendorName: true,
        requiresDate: true,
        requiresAmount: true,
        requiresGstNumber: true,
        requiresDescription: true,
        requiresCustomerInfo: false,
        minAmount: 30,
        maxAmount: 149.99,
      },
      [DocumentationTier.TIER_3]: {
        tier: DocumentationTier.TIER_3,
        requiresVendorName: true,
        requiresDate: true,
        requiresAmount: true,
        requiresGstNumber: true,
        requiresDescription: true,
        requiresCustomerInfo: true,
        minAmount: 150,
        maxAmount: null,
      },
    };

    return requirements[tier];
  }

  /**
   * Validate documentation for a receipt
   */
  static validateDocumentation(params: {
    amount: Money;
    vendorName?: string;
    date?: string;
    gstNumber?: string;
    description?: string;
    customerInfo?: string;
  }): { tier: DocumentationTier; status: DocumentationStatus; missingFields: string[] } {
    const tier = this.getTier(params.amount);
    const requirements = this.getRequirements(tier);
    const missingFields: string[] = [];

    if (requirements.requiresVendorName && !params.vendorName) {
      missingFields.push('vendorName');
    }

    if (requirements.requiresDate && !params.date) {
      missingFields.push('date');
    }

    if (requirements.requiresAmount && !params.amount) {
      missingFields.push('amount');
    }

    if (requirements.requiresGstNumber && !params.gstNumber) {
      missingFields.push('gstNumber');
    }

    if (requirements.requiresDescription && !params.description) {
      missingFields.push('description');
    }

    if (requirements.requiresCustomerInfo && !params.customerInfo) {
      missingFields.push('customerInfo');
    }

    let status: DocumentationStatus;
    if (missingFields.length === 0) {
      status = DocumentationStatus.SUFFICIENT;
    } else if (missingFields.length <= 1 && tier === DocumentationTier.TIER_1) {
      status = DocumentationStatus.REVIEW_REQUIRED;
    } else {
      status = DocumentationStatus.INSUFFICIENT;
    }

    return {
      tier,
      status,
      missingFields,
    };
  }

  /**
   * Check if documentation is sufficient for ITC claim
   */
  static isSufficientForITC(status: DocumentationStatus): boolean {
    return status === DocumentationStatus.SUFFICIENT;
  }

  /**
   * Get explanation for documentation status
   */
  static getExplanation(tier: DocumentationTier, status: DocumentationStatus): string {
    const tierDescriptions = {
      [DocumentationTier.TIER_1]:
        'Transactions under $30 have basic documentation requirements.',
      [DocumentationTier.TIER_2]:
        'Transactions between $30 and $149.99 require vendor name, date, amount, GST/HST number, and description.',
      [DocumentationTier.TIER_3]:
        'Transactions of $150 or more require complete documentation including customer information.',
    };

    const statusDescriptions = {
      [DocumentationStatus.SUFFICIENT]:
        'All required documentation is present.',
      [DocumentationStatus.INSUFFICIENT]:
        'Required documentation is missing. ITC cannot be claimed.',
      [DocumentationStatus.REVIEW_REQUIRED]:
        'Some documentation is missing. Review required to determine eligibility.',
    };

    return `${tierDescriptions[tier]} ${statusDescriptions[status]}`;
  }
}
