import { GstNumberStatus, GstNumberValidation } from './types';

/**
 * GST/HST Registration Number Validation
 * Format: 9 digits + 2 letters (RT) + 4 digits
 * Example: 123456789RT0001
 * Based on CRA Business Number structure
 */

export class GstHstRules {
  private static readonly GST_PATTERN = /^\d{9}RT\d{4}$/;
  private static readonly MIN_LENGTH = 15;
  private static readonly MAX_LENGTH = 15;

  /**
   * Validate GST/HST registration number format
   * Note: This only validates format, not actual registration with CRA
   */
  static validateGstNumber(gstNumber: string | null | undefined): GstNumberValidation {
    // Check for missing
    if (!gstNumber || gstNumber.trim() === '') {
      return {
        status: GstNumberStatus.MISSING,
        number: null,
        isValidFormat: false,
        reason: 'GST/HST number is missing',
      };
    }

    const cleaned = gstNumber.trim().toUpperCase();

    // Check length
    if (cleaned.length !== this.MIN_LENGTH) {
      return {
        status: GstNumberStatus.MALFORMED,
        number: cleaned,
        isValidFormat: false,
        reason: `GST/HST number must be exactly ${this.MIN_LENGTH} characters`,
      };
    }

    // Check format pattern
    if (!this.GST_PATTERN.test(cleaned)) {
      return {
        status: GstNumberStatus.INVALID_FORMAT,
        number: cleaned,
        isValidFormat: false,
        reason: 'GST/HST number must follow format: 9 digits + RT + 4 digits (e.g., 123456789RT0001)',
      };
    }

    // Check for suspicious patterns
    if (this.isSuspicious(cleaned)) {
      return {
        status: GstNumberStatus.SUSPICIOUS,
        number: cleaned,
        isValidFormat: true,
        reason: 'GST/HST number format is valid but contains suspicious patterns',
      };
    }

    // Format is valid
    return {
      status: GstNumberStatus.VALID_FORMAT,
      number: cleaned,
      isValidFormat: true,
      reason: 'GST/HST number format is valid',
    };
  }

  /**
   * Check for suspicious patterns in GST number
   */
  private static isSuspicious(gstNumber: string): boolean {
    // Check for repeated digits
    if (/(\d)\1{8}/.test(gstNumber)) {
      return true;
    }

    // Check for sequential digits
    if (/012345678|123456789/.test(gstNumber)) {
      return true;
    }

    // Check for common test patterns
    if (gstNumber.includes('000000000') || gstNumber.includes('111111111')) {
      return true;
    }

    return false;
  }

  /**
   * Format GST number for display (add spaces for readability)
   */
  static formatForDisplay(gstNumber: string): string {
    if (gstNumber.length === 15) {
      return `${gstNumber.substring(0, 9)} ${gstNumber.substring(9, 11)} ${gstNumber.substring(11)}`;
    }
    return gstNumber;
  }

  /**
   * Redact GST number for logging (show only last 4 digits)
   */
  static redactForLogging(gstNumber: string): string {
    if (gstNumber.length >= 4) {
      return `************${gstNumber.substring(gstNumber.length - 4)}`;
    }
    return '****';
  }

  /**
   * Check if GST number validation allows ITC claim
   */
  static canClaimITC(validation: GstNumberValidation): boolean {
    return (
      validation.status === GstNumberStatus.VALID_FORMAT ||
      validation.status === GstNumberStatus.SUSPICIOUS
    );
  }
}
