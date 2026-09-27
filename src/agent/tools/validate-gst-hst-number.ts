import { z } from 'zod';
import { GstHstRules } from '@/domain/cra/gst-hst-rules';
import { GstNumberValidation } from '@/domain/cra/types';

/**
 * Tool: Validate GST/HST Number
 * Validates the format of a Canadian GST/HST registration number
 * Note: This only validates format, not actual registration with CRA
 */

export const validateGstHstNumberTool = {
  description:
    'Validates the format of a Canadian GST/HST registration number. Returns format validation status (not actual CRA registration verification).',
  inputSchema: z.object({
    receiptId: z.string().describe('The ID of the receipt'),
    gstNumber: z.string().optional().describe('The GST/HST number to validate'),
  }),
  execute: async (input: {
    receiptId: string;
    gstNumber?: string;
  }): Promise<{
    receiptId: string;
    validation: GstNumberValidation;
    source: string;
  }> => {
    const validation = GstHstRules.validateGstNumber(input.gstNumber);

    return {
      receiptId: input.receiptId,
      validation,
      source: 'CRA_RULE_ENGINE',
    };
  },
};
