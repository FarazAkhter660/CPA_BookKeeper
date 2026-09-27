import { GIFICode, GIFIMappingResult } from './types';
import { GIFI_CATALOGUE, isValidGIFICode, getGIFICode } from './gifi-catalogue';

/**
 * GIFI Classification Engine
 * Maps expense descriptions to controlled GIFI codes
 */

export class GIFIMapper {
  /**
   * Map an expense description to a GIFI code
   * Returns the best match with confidence score
   */
  static mapToGIFI(description: string, category?: string): GIFIMappingResult {
    if (!description || description.trim() === '') {
      return {
        gifiCode: '',
        confidence: 0,
        description: '',
        status: 'not_found',
        reason: 'Empty description provided',
      };
    }

    const normalizedDesc = description.toLowerCase().trim();

    // If a specific GIFI code is provided, validate it
    if (category && isValidGIFICode(category)) {
      const gifiCode = getGIFICode(category);
      if (gifiCode) {
        return {
          gifiCode: gifiCode.code,
          confidence: 1.0,
          description: gifiCode.description,
          status: 'mapped',
        };
      }
    }

    // Find best match based on description
    const matches = this.findMatches(normalizedDesc);

    if (matches.length === 0) {
      return {
        gifiCode: '',
        confidence: 0,
        description: '',
        status: 'not_found',
        reason: 'No matching GIFI code found for description',
      };
    }

    // Get the best match (highest confidence)
    const bestMatch = matches[0];

    // If confidence is low, mark for review
    if (bestMatch.confidence < 0.7) {
      return {
        gifiCode: bestMatch.code,
        confidence: bestMatch.confidence,
        description: bestMatch.description,
        status: 'review_required',
        reason: 'Low confidence match - human review recommended',
      };
    }

    // If multiple matches with similar confidence, mark as ambiguous
    if (matches.length > 1 && matches[1].confidence >= bestMatch.confidence - 0.1) {
      return {
        gifiCode: bestMatch.code,
        confidence: bestMatch.confidence,
        description: bestMatch.description,
        status: 'ambiguous',
        reason: `Multiple possible matches: ${matches.map((m) => m.code).join(', ')}`,
      };
    }

    return {
      gifiCode: bestMatch.code,
      confidence: bestMatch.confidence,
      description: bestMatch.description,
      status: 'mapped',
    };
  }

  /**
   * Find matching GIFI codes based on description
   */
  private static findMatches(description: string): Array<GIFICode & { confidence: number }> {
    const matches: Array<GIFICode & { confidence: number }> = [];

    for (const gifi of GIFI_CATALOGUE) {
      const matchScore = this.calculateMatchScore(description, gifi);
      if (matchScore > 0) {
        matches.push({ ...gifi, confidence: matchScore });
      }
    }

    // Sort by confidence descending
    matches.sort((a, b) => b.confidence - a.confidence);

    return matches;
  }

  /**
   * Calculate match score between description and GIFI code
   */
  private static calculateMatchScore(description: string, gifi: GIFICode): number {
    let score = 0;
    const desc = description.toLowerCase();
    const gifiDesc = gifi.description.toLowerCase();

    // Check if description contains GIFI description words
    const gifiWords = gifiDesc.split(' ');
    const descWords = desc.split(' ');

    // Exact match on description
    if (desc === gifiDesc) {
      return 1.0;
    }

    // Check applicable expense types
    for (const expenseType of gifi.applicableExpenseTypes) {
      const expenseTypeLower = expenseType.toLowerCase();
      if (desc.includes(expenseTypeLower)) {
        score = Math.max(score, 0.9);
      }
    }

    // Check for partial word matches
    for (const gifiWord of gifiWords) {
      if (gifiWord.length > 3 && desc.includes(gifiWord)) {
        score = Math.max(score, 0.7);
      }
    }

    // Check description words against GIFI description
    for (const descWord of descWords) {
      if (descWord.length > 3 && gifiDesc.includes(descWord)) {
        score = Math.max(score, 0.6);
      }
    }

    return score;
  }

  /**
   * Validate a proposed GIFI code against the catalogue
   */
  static validateGIFICode(code: string): { valid: boolean; gifiCode?: GIFICode; reason?: string } {
    if (!code || code.trim() === '') {
      return {
        valid: false,
        reason: 'GIFI code is empty',
      };
    }

    const gifiCode = getGIFICode(code);

    if (!gifiCode) {
      return {
        valid: false,
        reason: `GIFI code ${code} not found in controlled catalogue`,
      };
    }

    return {
      valid: true,
      gifiCode,
    };
  }

  /**
   * Get candidate GIFI codes for a description (for LLM to choose from)
   */
  static getCandidates(description: string, limit: number = 5): GIFICode[] {
    const normalizedDesc = description.toLowerCase().trim();
    const matches = this.findMatches(normalizedDesc);

    return matches.slice(0, limit);
  }

  /**
   * Get explanation for GIFI mapping
   */
  static getExplanation(result: GIFIMappingResult): string {
    if (result.status === 'mapped') {
      return `GIFI ${result.gifiCode} — ${result.description} (confidence: ${(result.confidence * 100).toFixed(0)}%)`;
    }

    if (result.status === 'review_required') {
      return `GIFI ${result.gifiCode} — ${result.description} (confidence: ${(result.confidence * 100).toFixed(0)}%) - Review required due to low confidence`;
    }

    if (result.status === 'ambiguous') {
      return `GIFI ${result.gifiCode} — ${result.description} - ${result.reason}`;
    }

    return `No GIFI code found - ${result.reason}`;
  }
}
