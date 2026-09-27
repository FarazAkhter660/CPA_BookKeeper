import Decimal from 'decimal.js';

/**
 * Money-safe calculations using Decimal.js for precision
 * All monetary calculations must use this to avoid floating-point errors
 */
export class Money {
  private readonly value: Decimal;

  constructor(value: number | string | Decimal) {
    this.value = new Decimal(value);
  }

  static fromNumber(value: number): Money {
    return new Money(value);
  }

  static fromString(value: string): Money {
    return new Money(value);
  }

  static zero(): Money {
    return new Money(0);
  }

  add(other: Money): Money {
    return new Money(this.value.plus(other.value));
  }

  subtract(other: Money): Money {
    return new Money(this.value.minus(other.value));
  }

  multiply(factor: number | Decimal): Money {
    return new Money(this.value.times(factor));
  }

  divide(divisor: number | Decimal): Money {
    return new Money(this.value.div(divisor));
  }

  percentage(percent: number): Money {
    return new Money(this.value.times(percent).div(100));
  }

  roundToCents(): Money {
    return new Money(this.value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP));
  }

  toNumber(): number {
    return this.value.toNumber();
  }

  toString(): string {
    return this.value.toFixed(2);
  }

  toDecimal(): Decimal {
    return this.value;
  }

  equals(other: Money): boolean {
    return this.value.equals(other.value);
  }

  isGreaterThan(other: Money): boolean {
    return this.value.greaterThan(other.value);
  }

  isGreaterThanOrEqual(other: Money): boolean {
    return this.value.greaterThanOrEqualTo(other.value);
  }

  isLessThan(other: Money): boolean {
    return this.value.lessThan(other.value);
  }

  isLessThanOrEqual(other: Money): boolean {
    return this.value.lessThanOrEqualTo(other.value);
  }

  isNegative(): boolean {
    return this.value.isNegative();
  }

  isZero(): boolean {
    return this.value.isZero();
  }

  isPositive(): boolean {
    return this.value.isPositive();
  }

  abs(): Money {
    return new Money(this.value.abs());
  }

  /**
   * Format as Canadian currency string
   */
  formatCAD(): string {
    return `$${this.value.toFixed(2)}`;
  }

  /**
   * Create a copy
   */
  clone(): Money {
    return new Money(this.value);
  }
}

/**
 * Type for monetary values in the system
 */
export type MonetaryValue = Money;

/**
 * Helper function to create Money from various inputs
 */
export function money(value: number | string | Decimal): Money {
  return new Money(value);
}

/**
 * Calculate percentage of a monetary value
 * Returns a Money value representing the percentage
 */
export function calculatePercentage(amount: Money, percentage: number): Money {
  return amount.multiply(percentage).divide(100);
}

/**
 * Round money to nearest cent using Canadian rounding rules
 */
export function roundToNearestCent(amount: Money): Money {
  return amount.roundToCents();
}
