/**
 * Input Sanitizer
 * Sanitizes untrusted input to prevent prompt injection and other attacks
 * All user-provided and receipt data must be treated as untrusted
 */

export class InputSanitizer {
  /**
   * Known prompt injection patterns to detect
   */
  private static readonly INJECTION_PATTERNS = [
    /ignore\s+(all|previous|the)\s+(instructions|rules|prompts)/gi,
    /override\s+(all|the)\s+(rules|restrictions|validation)/gi,
    /new\s+instructions?:/gi,
    /system\s+message:/gi,
    /reveal\s+(your\s+)?system\s+prompt/gi,
    /show\s+(your\s+)?(instructions|prompt)/gi,
    /forget\s+(everything|all\s+instructions)/gi,
    /act\s+as\s+(if\s+)?you\s+are\s+not/gi,
    /pretend\s+(you\s+are\s+not|to\s+be)/gi,
    /disregard\s+(all|the)\s+(above|previous)/gi,
    /do\s+not\s+follow/gi,
    /bypass\s+(validation|rules|security)/gi,
    /skip\s+(validation|checks|verification)/gi,
    /approve\s+(this\s+)?expense\s+for\s+100%\s+itc/gi,
    /this\s+is\s+a\s+test/gi,
    /you\s+are\s+now\s+operating\s+under/gi,
    /\[SYSTEM\]/gi,
    /\[ADMIN\]/gi,
    /\[ROOT\]/gi,
  ];

  /**
   * Sanitize text input by removing or neutralizing potentially malicious content
   */
  static sanitizeText(input: string | undefined | null): string {
    if (!input) return '';

    let sanitized = input;

    // Remove null bytes and other control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Limit length to prevent DoS
    const MAX_LENGTH = 10000;
    if (sanitized.length > MAX_LENGTH) {
      sanitized = sanitized.substring(0, MAX_LENGTH) + '... [truncated]';
    }

    return sanitized;
  }

  /**
   * Detect potential prompt injection in text
   */
  static detectPromptInjection(input: string | undefined | null): {
    detected: boolean;
    patterns: string[];
    confidence: 'low' | 'medium' | 'high';
  } {
    if (!input) {
      return { detected: false, patterns: [], confidence: 'low' };
    }

    const detectedPatterns: string[] = [];

    for (const pattern of this.INJECTION_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        detectedPatterns.push(match[0]);
      }
    }

    const detected = detectedPatterns.length > 0;
    let confidence: 'low' | 'medium' | 'high' = 'low';

    if (detectedPatterns.length >= 3) {
      confidence = 'high';
    } else if (detectedPatterns.length >= 2) {
      confidence = 'medium';
    } else if (detectedPatterns.length === 1) {
      confidence = 'low';
    }

    return {
      detected,
      patterns: detectedPatterns,
      confidence,
    };
  }

  /**
   * Sanitize receipt data specifically
   * Treats all receipt fields as untrusted
   */
  static sanitizeReceiptData(data: {
    vendor?: string;
    description?: string;
    notes?: string;
    customerInfo?: string;
  }): {
    sanitized: {
      vendor?: string;
      description?: string;
      notes?: string;
      customerInfo?: string;
    };
    injectionDetected: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let injectionDetected = false;

    const sanitized = {
      vendor: this.sanitizeText(data.vendor),
      description: this.sanitizeText(data.description),
      notes: this.sanitizeText(data.notes),
      customerInfo: this.sanitizeText(data.customerInfo),
    };

    // Check each field for injection
    for (const [field, value] of Object.entries(sanitized)) {
      if (value) {
        const detection = this.detectPromptInjection(value);
        if (detection.detected) {
          injectionDetected = true;
          warnings.push(
            `Potential prompt injection detected in ${field}: ${detection.patterns.join(', ')}`
          );
        }
      }
    }

    return { sanitized, injectionDetected, warnings };
  }

  /**
   * Redact sensitive information for logging
   */
  static redactSensitive(input: string, type: 'gst' | 'phone' | 'email' | 'generic'): string {
    if (!input) return '';

    switch (type) {
      case 'gst':
        // Show last 4 digits of GST number
        if (input.length >= 4) {
          return `************${input.substring(input.length - 4)}`;
        }
        return '****';

      case 'phone':
        // Show last 4 digits
        if (input.length >= 4) {
          return `***-***-${input.substring(input.length - 4)}`;
        }
        return '***';

      case 'email':
        // Show first 2 chars and domain
        const parts = input.split('@');
        if (parts.length === 2) {
          return `${parts[0].substring(0, 2)}***@${parts[1]}`;
        }
        return '***@***.***';

      case 'generic':
      default:
        // Show first and last 2 chars
        if (input.length <= 4) return '****';
        return `${input.substring(0, 2)}***${input.substring(input.length - 2)}`;
    }
  }

  /**
   * Validate that input doesn't contain executable code or scripts
   */
  static detectExecutableCode(input: string): boolean {
    const codePatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /function\s*\(/i,
      /=>\s*{/,
      /import\s+/i,
      /require\s*\(/i,
      /exec\s*\(/i,
    ];

    return codePatterns.some((pattern) => pattern.test(input));
  }

  /**
   * Sanitize for safe display in UI (HTML escaping)
   */
  static escapeHtml(input: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };

    return input.replace(/[&<>"']/g, (char) => map[char]);
  }
}
