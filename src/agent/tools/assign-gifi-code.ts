import { z } from 'zod';
import { GIFIMapper, GIFIMappingResult } from '@/domain/gifi';

/**
 * Tool: Assign GIFI Code
 * Maps an expense to a GIFI code using the controlled catalogue
 * Validates that the proposed GIFI code exists in the catalogue
 */

export const assignGifiCodeTool = {
  description:
    'Maps an expense description to a GIFI code using the controlled CRA GIFI catalogue. Validates that the code exists.',
  inputSchema: z.object({
    receiptId: z.string().describe('The ID of the receipt'),
    description: z.string().describe('The expense description'),
    proposedGifiCode: z.string().optional().describe('A specific GIFI code to validate and assign'),
  }),
  execute: async (input: {
    receiptId: string;
    description: string;
    proposedGifiCode?: string;
  }): Promise<{
    receiptId: string;
    mapping: GIFIMappingResult;
    explanation: string;
    source: string;
  }> => {
    const mapping = GIFIMapper.mapToGIFI(input.description, input.proposedGifiCode);

    // If a specific GIFI code was proposed, validate it
    if (input.proposedGifiCode) {
      const validation = GIFIMapper.validateGIFICode(input.proposedGifiCode);
      if (!validation.valid) {
        return {
          receiptId: input.receiptId,
          mapping: {
            gifiCode: '',
            confidence: 0,
            description: '',
            status: 'not_found',
            reason: validation.reason,
          },
          explanation: `GIFI code validation failed: ${validation.reason}`,
          source: 'GIFI_CATALOGUE',
        };
      }
    }

    return {
      receiptId: input.receiptId,
      mapping,
      explanation: GIFIMapper.getExplanation(mapping),
      source: 'GIFI_CATALOGUE',
    };
  },
};
