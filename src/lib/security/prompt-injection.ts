/**
 * Prompt Injection Detection and Input Sanitization
 * 
 * This module provides security functions to detect and prevent
 * prompt injection attacks in the AI agent system.
 */

export enum SecurityViolation {
  DIRECT_INJECTION = 'direct_injection',
  INDIRECT_INJECTION = 'indirect_injection',
  DATA_EXFILTRATION = 'data_exfiltration',
  TOOL_ABUSE = 'tool_abuse',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  CONTEXT_MANIPULATION = 'context_manipulation',
}

export interface SecurityCheckResult {
  isDetected: boolean;
  violation?: SecurityViolation;
  confidence: number;
  sanitized?: string;
}

/**
 * Direct prompt injection patterns
 */
const DIRECT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /forget\s+(everything|all\s+above)/i,
  /override\s+(the\s+)?(validation|rules|checks)/i,
  /new\s+system\s+prompt/i,
  /change\s+your\s+instructions/i,
  /act\s+as\s+(a\s+)?(tax\s+auditor|admin|supervisor)/i,
  /you\s+are\s+now/i,
  /from\s+now\s+on/i,
  /starting\s+now/i,
  /disable\s+(validation|security|checks)/i,
  /bypass\s+(validation|security|rules)/i,
  /skip\s+(validation|verification|checks)/i,
];

/**
 * Indirect prompt injection patterns
 */
const INDIRECT_INJECTION_PATTERNS = [
  /tell\s+me\s+(about|all)\s+(your|the)\s+(system\s+prompt|internal\s+rules|instructions)/i,
  /show\s+me\s+(your|the)\s+(system\s+prompt|internal\s+state)/i,
  /what\s+(are|is)\s+your\s+(instructions|rules|guidelines)/i,
  /run\s+(the\s+)?(\w+)\s+tool\s+(on\s+all|for\s+every)/i,
  /execute\s+(the\s+)?(\w+)\s+tool\s+(on\s+all|for\s+every)/i,
  /grant\s+me\s+(admin|root|superuser)\s+access/i,
  /give\s+me\s+(admin|root|superuser)\s+privileges/i,
  /list\s+all\s+(receipts|transactions|data)/i,
  /show\s+me\s+all\s+(receipts|transactions|data)/i,
];

/**
 * Data exfiltration patterns
 */
const DATA_EXFILTRATION_PATTERNS = [
  /tell\s+me\s+(about|all)\s+(the\s+)?(other\s+)?receipts/i,
  /what\s+(other\s+)?receipts\s+have\s+you\s+processed/i,
  /show\s+me\s+(the\s+)?(other\s+)?data/i,
  /export\s+all\s+(receipts|data|transactions)/i,
  /download\s+all\s+(receipts|data|transactions)/i,
];

/**
 * Tool abuse patterns
 */
const TOOL_ABUSE_PATTERNS = [
  /run\s+(the\s+)?(\w+)\s+tool\s+(on\s+all|for\s+every|without\s+validation)/i,
  /execute\s+(the\s+)?(\w+)\s+tool\s+(on\s+all|for\s+every|without\s+validation)/i,
  /use\s+(the\s+)?(\w+)\s+tool\s+to\s+(modify|delete|change)\s+all/i,
];

/**
 * Context manipulation patterns
 */
const CONTEXT_MANIPULATION_PATTERNS = [
  /this\s+is\s+(a\s+)?(critical|emergency|urgent)/i,
  /skip\s+all\s+validation\s+because/i,
  /bypass\s+checks\s+due\s+to/i,
  /ignore\s+security\s+for/i,
];

/**
 * Maximum input length to prevent DoS
 */
const MAX_INPUT_LENGTH = 10000;

/**
 * Detect prompt injection in input text
 */
export function detectPromptInjection(input: string): SecurityCheckResult {
  if (!input || typeof input !== 'string') {
    return { isDetected: false, confidence: 0 };
  }

  const normalizedInput = input.toLowerCase();

  // Check tool abuse patterns first (most specific)
  for (const pattern of TOOL_ABUSE_PATTERNS) {
    if (pattern.test(normalizedInput)) {
      return {
        isDetected: true,
        violation: SecurityViolation.TOOL_ABUSE,
        confidence: 0.85,
      };
    }
  }

  // Check data exfiltration patterns
  for (const pattern of DATA_EXFILTRATION_PATTERNS) {
    if (pattern.test(normalizedInput)) {
      return {
        isDetected: true,
        violation: SecurityViolation.DATA_EXFILTRATION,
        confidence: 0.85,
      };
    }
  }

  // Check direct injection patterns
  for (const pattern of DIRECT_INJECTION_PATTERNS) {
    if (pattern.test(normalizedInput)) {
      return {
        isDetected: true,
        violation: SecurityViolation.DIRECT_INJECTION,
        confidence: 0.9,
      };
    }
  }

  // Check indirect injection patterns
  for (const pattern of INDIRECT_INJECTION_PATTERNS) {
    if (pattern.test(normalizedInput)) {
      return {
        isDetected: true,
        violation: SecurityViolation.INDIRECT_INJECTION,
        confidence: 0.8,
      };
    }
  }

  // Check context manipulation patterns
  for (const pattern of CONTEXT_MANIPULATION_PATTERNS) {
    if (pattern.test(normalizedInput)) {
      return {
        isDetected: true,
        violation: SecurityViolation.CONTEXT_MANIPULATION,
        confidence: 0.75,
      };
    }
  }

  // Check for suspicious patterns
  if (normalizedInput.includes('base64') || normalizedInput.includes('decode')) {
    return {
      isDetected: true,
      violation: SecurityViolation.INDIRECT_INJECTION,
      confidence: 0.7,
    };
  }

  // Check for code execution patterns
  if (normalizedInput.includes('execute') || normalizedInput.includes('run') || 
      normalizedInput.includes('python') || normalizedInput.includes('javascript')) {
    return {
      isDetected: true,
      violation: SecurityViolation.INDIRECT_INJECTION,
      confidence: 0.6,
    };
  }

  return { isDetected: false, confidence: 0 };
}

/**
 * Sanitize input by removing potentially dangerous content
 */
export function sanitizeInput(input: string | null): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Truncate if too long
  if (input.length >= MAX_INPUT_LENGTH) {
    input = input.substring(0, MAX_INPUT_LENGTH - 1);
  }

  let sanitized = input;

  // Remove script tags and dangerous HTML
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
  sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<object[^>]*>.*?<\/object>/gi, '');
  sanitized = sanitized.replace(/<embed[^>]*>/gi, '');

  // Remove injection patterns (case-insensitive)
  for (const pattern of DIRECT_INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  for (const pattern of INDIRECT_INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  for (const pattern of DATA_EXFILTRATION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  for (const pattern of TOOL_ABUSE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  for (const pattern of CONTEXT_MANIPULATION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  // Remove suspicious keywords
  sanitized = sanitized.replace(/base64/gi, '[REDACTED]');
  sanitized = sanitized.replace(/decode/gi, '[REDACTED]');
  sanitized = sanitized.replace(/execute/gi, '[REDACTED]');
  sanitized = sanitized.replace(/python/gi, '[REDACTED]');
  sanitized = sanitized.replace(/javascript/gi, '[REDACTED]');

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}

/**
 * Validate user message before processing
 */
export function validateUserMessage(message: string): {
  isValid: boolean;
  error?: string;
  sanitized?: string;
} {
  if (!message || typeof message !== 'string') {
    return { isValid: false, error: 'Message is required' };
  }

  if (message.length > MAX_INPUT_LENGTH) {
    return { isValid: false, error: 'Message exceeds maximum length' };
  }

  const securityCheck = detectPromptInjection(message);
  if (securityCheck.isDetected) {
    return {
      isValid: false,
      error: `Security violation detected: ${securityCheck.violation}`,
    };
  }

  const sanitized = sanitizeInput(message);
  return { isValid: true, sanitized };
}

/**
 * Validate receipt data before processing
 */
export function validateReceiptData(data: {
  vendor?: string;
  description?: string;
  notes?: string;
}): {
  isValid: boolean;
  error?: string;
  sanitized?: typeof data;
} {
  const sanitized: typeof data = {};

  if (data.vendor) {
    const vendorCheck = detectPromptInjection(data.vendor);
    if (vendorCheck.isDetected) {
      return {
        isValid: false,
        error: `Security violation in vendor: ${vendorCheck.violation}`,
      };
    }
    sanitized.vendor = sanitizeInput(data.vendor);
  }

  if (data.description) {
    const descCheck = detectPromptInjection(data.description);
    if (descCheck.isDetected) {
      return {
        isValid: false,
        error: `Security violation in description: ${descCheck.violation}`,
      };
    }
    sanitized.description = sanitizeInput(data.description);
  }

  if (data.notes) {
    const notesCheck = detectPromptInjection(data.notes);
    if (notesCheck.isDetected) {
      return {
        isValid: false,
        error: `Security violation in notes: ${notesCheck.violation}`,
      };
    }
    sanitized.notes = sanitizeInput(data.notes);
  }

  return { isValid: true, sanitized };
}
