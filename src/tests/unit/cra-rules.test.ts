import { describe, it, expect } from 'vitest';
import { 
  DocumentationRules, 
  DocumentationTier, 
  DocumentationStatus,
  ITCRules, 
  ITCStatus,
  TaxType
} from '@/domain/cra';
import { Money } from '@/domain/money/Money';

describe('CRA Documentation Rules', () => {
  describe('Tier Determination', () => {
    it('should assign Tier 1 for amounts under $30', () => {
      const money = new Money(25);
      const tier = DocumentationRules.getTier(money);
      expect(tier).toBe(DocumentationTier.TIER_1);
    });

    it('should assign Tier 2 for amounts between $30 and $149.99', () => {
      const money = new Money(100);
      const tier = DocumentationRules.getTier(money);
      expect(tier).toBe(DocumentationTier.TIER_2);
    });

    it('should assign Tier 3 for amounts $150 and above', () => {
      const money = new Money(200);
      const tier = DocumentationRules.getTier(money);
      expect(tier).toBe(DocumentationTier.TIER_3);
    });

    it('should handle boundary at $30', () => {
      const money = new Money(30);
      const tier = DocumentationRules.getTier(money);
      expect(tier).toBe(DocumentationTier.TIER_2);
    });

    it('should handle boundary at $150', () => {
      const money = new Money(150);
      const tier = DocumentationRules.getTier(money);
      expect(tier).toBe(DocumentationTier.TIER_3);
    });
  });

  describe('Documentation Requirements', () => {
    it('should return Tier 1 requirements', () => {
      const requirements = DocumentationRules.getRequirements(DocumentationTier.TIER_1);
      expect(requirements.requiresVendorName).toBe(true);
      expect(requirements.requiresDate).toBe(true);
      expect(requirements.requiresAmount).toBe(true);
      expect(requirements.requiresGstNumber).toBe(false);
      expect(requirements.requiresDescription).toBe(false);
      expect(requirements.requiresCustomerInfo).toBe(false);
    });

    it('should return Tier 2 requirements', () => {
      const requirements = DocumentationRules.getRequirements(DocumentationTier.TIER_2);
      expect(requirements.requiresVendorName).toBe(true);
      expect(requirements.requiresDate).toBe(true);
      expect(requirements.requiresAmount).toBe(true);
      expect(requirements.requiresGstNumber).toBe(true);
      expect(requirements.requiresDescription).toBe(true);
      expect(requirements.requiresCustomerInfo).toBe(false);
    });

    it('should return Tier 3 requirements', () => {
      const requirements = DocumentationRules.getRequirements(DocumentationTier.TIER_3);
      expect(requirements.requiresVendorName).toBe(true);
      expect(requirements.requiresDate).toBe(true);
      expect(requirements.requiresAmount).toBe(true);
      expect(requirements.requiresGstNumber).toBe(true);
      expect(requirements.requiresDescription).toBe(true);
      expect(requirements.requiresCustomerInfo).toBe(true);
    });
  });

  describe('Documentation Validation', () => {
    it('should validate complete Tier 1 documentation', () => {
      const result = DocumentationRules.validateDocumentation({
        amount: new Money(25),
        vendorName: 'Office Supplies Co',
        date: '2024-01-15',
      });

      expect(result.tier).toBe(DocumentationTier.TIER_1);
      expect(result.status).toBe(DocumentationStatus.SUFFICIENT);
      expect(result.missingFields).toHaveLength(0);
    });

    it('should validate complete Tier 2 documentation', () => {
      const result = DocumentationRules.validateDocumentation({
        amount: new Money(100),
        vendorName: 'Office Supplies Co',
        date: '2024-01-15',
        gstNumber: '123456789RT0001',
        description: 'Office supplies',
      });

      expect(result.tier).toBe(DocumentationTier.TIER_2);
      expect(result.status).toBe(DocumentationStatus.SUFFICIENT);
      expect(result.missingFields).toHaveLength(0);
    });

    it('should validate complete Tier 3 documentation', () => {
      const result = DocumentationRules.validateDocumentation({
        amount: new Money(200),
        vendorName: 'Office Supplies Co',
        date: '2024-01-15',
        gstNumber: '123456789RT0001',
        description: 'Office supplies',
        customerInfo: 'ABC Corp',
      });

      expect(result.tier).toBe(DocumentationTier.TIER_3);
      expect(result.status).toBe(DocumentationStatus.SUFFICIENT);
      expect(result.missingFields).toHaveLength(0);
    });

    it('should identify missing vendor name', () => {
      const result = DocumentationRules.validateDocumentation({
        amount: new Money(100),
        date: '2024-01-15',
        gstNumber: '123456789RT0001',
        description: 'Office supplies',
      });

      expect(result.status).toBe(DocumentationStatus.INSUFFICIENT);
      expect(result.missingFields).toContain('vendorName');
    });

    it('should identify missing GST number for Tier 2', () => {
      const result = DocumentationRules.validateDocumentation({
        amount: new Money(100),
        vendorName: 'Office Supplies Co',
        date: '2024-01-15',
        description: 'Office supplies',
      });

      expect(result.status).toBe(DocumentationStatus.INSUFFICIENT);
      expect(result.missingFields).toContain('gstNumber');
    });

    it('should identify missing description for Tier 2', () => {
      const result = DocumentationRules.validateDocumentation({
        amount: new Money(100),
        vendorName: 'Office Supplies Co',
        date: '2024-01-15',
        gstNumber: '123456789RT0001',
      });

      expect(result.status).toBe(DocumentationStatus.INSUFFICIENT);
      expect(result.missingFields).toContain('description');
    });

    it('should identify missing customer info for Tier 3', () => {
      const result = DocumentationRules.validateDocumentation({
        amount: new Money(200),
        vendorName: 'Office Supplies Co',
        date: '2024-01-15',
        gstNumber: '123456789RT0001',
        description: 'Office supplies',
      });

      expect(result.status).toBe(DocumentationStatus.INSUFFICIENT);
      expect(result.missingFields).toContain('customerInfo');
    });

    it('should handle multiple missing fields', () => {
      const result = DocumentationRules.validateDocumentation({
        amount: new Money(100),
        date: '2024-01-15',
      });

      expect(result.status).toBe(DocumentationStatus.INSUFFICIENT);
      expect(result.missingFields.length).toBeGreaterThan(1);
    });
  });

  describe('ITC Eligibility', () => {
    it('should allow ITC for sufficient documentation', () => {
      const isEligible = DocumentationRules.isSufficientForITC(DocumentationStatus.SUFFICIENT);
      expect(isEligible).toBe(true);
    });

    it('should deny ITC for insufficient documentation', () => {
      const isEligible = DocumentationRules.isSufficientForITC(DocumentationStatus.INSUFFICIENT);
      expect(isEligible).toBe(false);
    });

    it('should deny ITC for review required status', () => {
      const isEligible = DocumentationRules.isSufficientForITC(DocumentationStatus.REVIEW_REQUIRED);
      expect(isEligible).toBe(false);
    });
  });

  describe('Explanation Generation', () => {
    it('should generate explanation for Tier 1 sufficient', () => {
      const explanation = DocumentationRules.getExplanation(
        DocumentationTier.TIER_1,
        DocumentationStatus.SUFFICIENT
      );
      expect(explanation).toContain('under $30');
      expect(explanation).toContain('All required documentation');
    });

    it('should generate explanation for Tier 2 insufficient', () => {
      const explanation = DocumentationRules.getExplanation(
        DocumentationTier.TIER_2,
        DocumentationStatus.INSUFFICIENT
      );
      expect(explanation).toContain('between $30 and $149.99');
      expect(explanation).toContain('Required documentation is missing');
    });

    it('should generate explanation for Tier 3 sufficient', () => {
      const explanation = DocumentationRules.getExplanation(
        DocumentationTier.TIER_3,
        DocumentationStatus.SUFFICIENT
      );
      expect(explanation).toContain('$150 or more');
      expect(explanation).toContain('All required documentation');
    });
  });
});

describe('CRA ITC Rules', () => {
  describe('ITC Calculation', () => {
    it('should calculate 100% ITC for general expenses', () => {
      const result = ITCRules.calculateEligibleITC({
        subtotal: new Money(100),
        taxAmount: new Money(13),
        taxType: TaxType.GST,
        expenseCategory: 'Office Supplies',
        commercialUsePercentage: 100,
        mealEntertainment: false,
        documentationStatus: DocumentationStatus.SUFFICIENT,
        documentationTier: DocumentationTier.TIER_2,
      });

      expect(result.eligibleITC.toNumber()).toBe(13);
      expect(result.eligibilityPercentage).toBe(1);
      expect(result.status).toBe(ITCStatus.ELIGIBLE);
    });

    it('should calculate 50% ITC for meals and entertainment', () => {
      const result = ITCRules.calculateEligibleITC({
        subtotal: new Money(100),
        taxAmount: new Money(13),
        taxType: TaxType.GST,
        expenseCategory: 'Meals & Entertainment',
        commercialUsePercentage: 100,
        mealEntertainment: true,
        documentationStatus: DocumentationStatus.SUFFICIENT,
        documentationTier: DocumentationTier.TIER_2,
      });

      expect(result.eligibleITC.toNumber()).toBe(6.50);
      expect(result.eligibilityPercentage).toBe(0.5);
      expect(result.status).toBe(ITCStatus.PARTIAL);
      expect(result.ruleApplied).toBe('MEAL_ENTERTAINMENT_RESTRICTION');
    });

    it('should apply commercial use percentage', () => {
      const result = ITCRules.calculateEligibleITC({
        subtotal: new Money(100),
        taxAmount: new Money(13),
        taxType: TaxType.GST,
        expenseCategory: 'Office Supplies',
        commercialUsePercentage: 75,
        mealEntertainment: false,
        documentationStatus: DocumentationStatus.SUFFICIENT,
        documentationTier: DocumentationTier.TIER_2,
      });

      expect(result.eligibleITC.toNumber()).toBe(9.75);
      expect(result.eligibilityPercentage).toBe(0.75);
      expect(result.status).toBe(ITCStatus.PARTIAL);
    });

    it('should combine 50% rule with commercial use', () => {
      const result = ITCRules.calculateEligibleITC({
        subtotal: new Money(100),
        taxAmount: new Money(13),
        taxType: TaxType.GST,
        expenseCategory: 'Meals & Entertainment',
        commercialUsePercentage: 80,
        mealEntertainment: true,
        documentationStatus: DocumentationStatus.SUFFICIENT,
        documentationTier: DocumentationTier.TIER_2,
      });

      expect(result.eligibleITC.toNumber()).toBe(5.20);
      expect(result.eligibilityPercentage).toBe(0.4);
      expect(result.status).toBe(ITCStatus.PARTIAL);
    });

    it('should return zero ITC for insufficient documentation', () => {
      const result = ITCRules.calculateEligibleITC({
        subtotal: new Money(100),
        taxAmount: new Money(13),
        taxType: TaxType.GST,
        expenseCategory: 'Office Supplies',
        commercialUsePercentage: 100,
        mealEntertainment: false,
        documentationStatus: DocumentationStatus.INSUFFICIENT,
        documentationTier: DocumentationTier.TIER_2,
      });

      expect(result.eligibleITC.isZero()).toBe(true);
      expect(result.status).toBe(ITCStatus.INELIGIBLE);
      expect(result.reasonCode).toBe('INSUFFICIENT_DOCUMENTATION');
    });

    it('should return review status for review required documentation', () => {
      const result = ITCRules.calculateEligibleITC({
        subtotal: new Money(100),
        taxAmount: new Money(13),
        taxType: TaxType.GST,
        expenseCategory: 'Office Supplies',
        commercialUsePercentage: 100,
        mealEntertainment: false,
        documentationStatus: DocumentationStatus.REVIEW_REQUIRED,
        documentationTier: DocumentationTier.TIER_1,
      });

      expect(result.eligibleITC.isZero()).toBe(true);
      expect(result.status).toBe(ITCStatus.REVIEW);
      expect(result.reasonCode).toBe('DOCUMENTATION_REVIEW_REQUIRED');
    });

    it('should handle charity exception for meals', () => {
      const result = ITCRules.calculateEligibleITC({
        subtotal: new Money(100),
        taxAmount: new Money(13),
        taxType: TaxType.GST,
        expenseCategory: 'Meals & Entertainment',
        commercialUsePercentage: 100,
        mealEntertainment: true,
        documentationStatus: DocumentationStatus.SUFFICIENT,
        documentationTier: DocumentationTier.TIER_2,
        mealPolicyType: 'charity',
      });

      expect(result.eligibleITC.toNumber()).toBe(13);
      expect(result.eligibilityPercentage).toBe(1);
      expect(result.ruleApplied).toBe('MEAL_CHARITY_EXCEPTION');
    });

    it('should handle truck driver exception', () => {
      const result = ITCRules.calculateEligibleITC({
        subtotal: new Money(100),
        taxAmount: new Money(13),
        taxType: TaxType.GST,
        expenseCategory: 'Meals & Entertainment',
        commercialUsePercentage: 100,
        mealEntertainment: true,
        documentationStatus: DocumentationStatus.SUFFICIENT,
        documentationTier: DocumentationTier.TIER_2,
        mealPolicyType: 'truckDriver',
      });

      expect(result.eligibleITC.toNumber()).toBe(10.40);
      expect(result.eligibilityPercentage).toBe(0.8);
      expect(result.ruleApplied).toBe('MEAL_TRUCK_DRIVER_EXCEPTION');
    });
  });

  describe('ITC Validation', () => {
    it('should validate correct ITC result', () => {
      const result = ITCRules.calculateEligibleITC({
        subtotal: new Money(100),
        taxAmount: new Money(13),
        taxType: TaxType.GST,
        expenseCategory: 'Office Supplies',
        commercialUsePercentage: 100,
        mealEntertainment: false,
        documentationStatus: DocumentationStatus.SUFFICIENT,
        documentationTier: DocumentationTier.TIER_2,
      });

      const validation = ITCRules.validateResult(result);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect ITC exceeding gross tax', () => {
      const result = {
        grossTax: new Money(10),
        eligibilityPercentage: 1.5,
        eligibleITC: new Money(15),
        reasonCode: 'FULL_ELIGIBILITY',
        status: ITCStatus.ELIGIBLE,
        ruleApplied: 'STANDARD_ITC',
        documentation: {
          tier: DocumentationTier.TIER_2,
          status: DocumentationStatus.SUFFICIENT,
        },
      };

      const validation = ITCRules.validateResult(result);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Eligible ITC cannot exceed gross tax');
    });

    it('should detect negative eligibility percentage', () => {
      const result = {
        grossTax: new Money(10),
        eligibilityPercentage: -0.5,
        eligibleITC: new Money(5),
        reasonCode: 'FULL_ELIGIBILITY',
        status: ITCStatus.PARTIAL,
        ruleApplied: 'STANDARD_ITC',
        documentation: {
          tier: DocumentationTier.TIER_2,
          status: DocumentationStatus.SUFFICIENT,
        },
      };

      const validation = ITCRules.validateResult(result);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Eligibility percentage must be between 0 and 1');
    });
  });

  describe('Input Validation', () => {
    it('should throw on invalid commercial use percentage', () => {
      expect(() => {
        ITCRules.calculateEligibleITC({
          subtotal: new Money(100),
          taxAmount: new Money(13),
          taxType: TaxType.GST,
          expenseCategory: 'Office Supplies',
          commercialUsePercentage: 150,
          mealEntertainment: false,
          documentationStatus: DocumentationStatus.SUFFICIENT,
          documentationTier: DocumentationTier.TIER_2,
        });
      }).toThrow('Commercial use percentage must be between 0 and 100');
    });

    it('should throw on negative tax amount', () => {
      expect(() => {
        ITCRules.calculateEligibleITC({
          subtotal: new Money(100),
          taxAmount: new Money(-13),
          taxType: TaxType.GST,
          expenseCategory: 'Office Supplies',
          commercialUsePercentage: 100,
          mealEntertainment: false,
          documentationStatus: DocumentationStatus.SUFFICIENT,
          documentationTier: DocumentationTier.TIER_2,
        });
      }).toThrow('Tax amount cannot be negative');
    });
  });
});
