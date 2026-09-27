import { describe, it, expect } from 'vitest';
import { Money, calculatePercentage, roundToNearestCent } from '@/domain/money/Money';

describe('Money', () => {
  describe('creation', () => {
    it('should create money from number', () => {
      const money = new Money(100.50);
      expect(money.toNumber()).toBe(100.50);
    });

    it('should create money from string', () => {
      const money = Money.fromString('100.50');
      expect(money.toNumber()).toBe(100.50);
    });

    it('should create zero money', () => {
      const money = Money.zero();
      expect(money.isZero()).toBe(true);
    });

    it('should handle negative amounts', () => {
      const money = new Money(-100);
      expect(money.isNegative()).toBe(true);
    });
  });

  describe('arithmetic operations', () => {
    it('should add money correctly', () => {
      const money1 = new Money(100);
      const money2 = new Money(50);
      const sum = money1.add(money2);
      expect(sum.toNumber()).toBe(150);
    });

    it('should subtract money correctly', () => {
      const money1 = new Money(100);
      const money2 = new Money(30);
      const difference = money1.subtract(money2);
      expect(difference.toNumber()).toBe(70);
    });

    it('should multiply correctly', () => {
      const money = new Money(100);
      const result = money.multiply(2);
      expect(result.toNumber()).toBe(200);
    });

    it('should divide correctly', () => {
      const money = new Money(100);
      const result = money.divide(2);
      expect(result.toNumber()).toBe(50);
    });

    it('should calculate percentage correctly', () => {
      const money = new Money(100);
      const result = money.percentage(50);
      expect(result.toNumber()).toBe(50);
    });

    it('should handle decimal percentages', () => {
      const money = new Money(100);
      const result = money.percentage(12.5);
      expect(result.toNumber()).toBe(12.5);
    });
  });

  describe('comparison', () => {
    it('should compare equal amounts', () => {
      const money1 = new Money(100);
      const money2 = new Money(100);
      expect(money1.equals(money2)).toBe(true);
    });

    it('should compare different amounts', () => {
      const money1 = new Money(100);
      const money2 = new Money(50);
      expect(money1.equals(money2)).toBe(false);
    });

    it('should check if greater than', () => {
      const money1 = new Money(100);
      const money2 = new Money(50);
      expect(money1.isGreaterThan(money2)).toBe(true);
      expect(money2.isGreaterThan(money1)).toBe(false);
    });

    it('should check if less than', () => {
      const money1 = new Money(50);
      const money2 = new Money(100);
      expect(money1.isLessThan(money2)).toBe(true);
      expect(money2.isLessThan(money1)).toBe(false);
    });

    it('should check greater than or equal', () => {
      const money1 = new Money(100);
      const money2 = new Money(100);
      expect(money1.isGreaterThanOrEqual(money2)).toBe(true);
    });

    it('should check less than or equal', () => {
      const money1 = new Money(100);
      const money2 = new Money(100);
      expect(money1.isLessThanOrEqual(money2)).toBe(true);
    });
  });

  describe('formatting', () => {
    it('should format as CAD currency', () => {
      const money = new Money(100);
      expect(money.formatCAD()).toBe('$100.00');
    });

    it('should format with cents', () => {
      const money = new Money(100.50);
      expect(money.formatCAD()).toBe('$100.50');
    });

    it('should format zero', () => {
      const money = Money.zero();
      expect(money.formatCAD()).toBe('$0.00');
    });

    it('should format to string with 2 decimal places', () => {
      const money = new Money(100.5);
      expect(money.toString()).toBe('100.50');
    });
  });

  describe('utility functions', () => {
    it('should calculate percentage of amount', () => {
      const amount = new Money(100);
      const result = calculatePercentage(amount, 50);
      expect(result.toNumber()).toBe(50);
    });

    it('should round to nearest cent', () => {
      const money = new Money(100.505);
      const rounded = roundToNearestCent(money);
      expect(rounded.toNumber()).toBe(100.51);
    });

    it('should handle half-up rounding', () => {
      const money = new Money(100.504);
      const rounded = roundToNearestCent(money);
      expect(rounded.toNumber()).toBe(100.50);
    });
  });

  describe('edge cases', () => {
    it('should handle floating point precision correctly', () => {
      const money1 = new Money(0.1);
      const money2 = new Money(0.2);
      const sum = money1.add(money2);
      expect(sum.toNumber()).toBeCloseTo(0.30, 10);
    });

    it('should clone money correctly', () => {
      const money = new Money(100);
      const clone = money.clone();
      expect(clone.equals(money)).toBe(true);
      expect(clone).not.toBe(money);
    });

    it('should get absolute value', () => {
      const money = new Money(-100);
      const abs = money.abs();
      expect(abs.toNumber()).toBe(100);
    });

    it('should check if positive', () => {
      const money = new Money(100);
      expect(money.isPositive()).toBe(true);
    });
  });
});
