/**
 * CRA Rules Engine
 * Deterministic business logic for Canadian tax compliance
 */

export * from './types';
export * from './documentation-rules';
export * from './gst-hst-rules';
export * from './itc-rules';
export * from './meals-rules';

// Re-export commonly used classes
export { DocumentationRules } from './documentation-rules';
export { ITCRules } from './itc-rules';
export { MealsRules } from './meals-rules';
