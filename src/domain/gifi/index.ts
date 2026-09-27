/**
 * GIFI Classification Engine
 * Controlled catalogue for CRA financial statement codes
 */

export * from './types';
export * from './gifi-catalogue';
export * from './gifi-mapper';

// Re-export commonly used items
export { GIFIMapper } from './gifi-mapper';
export type { GIFIMappingResult } from './types';
