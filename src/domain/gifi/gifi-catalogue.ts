import { GIFICode } from './types';

/**
 * Controlled GIFI Code Catalogue
 * Based on CRA GIFI codes for financial statements
 * https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/t2/406.html
 */

export const GIFI_CATALOGUE: GIFICode[] = [
  // Assets
  {
    code: '1001',
    description: 'Cash',
    category: 'Current Assets',
    parentCategory: 'Assets',
    applicableExpenseTypes: ['cash', 'bank deposit', 'petty cash'],
    confidence: 1.0,
    source: 'CRA_OFFICIAL',
  },
  {
    code: '1002',
    description: 'Accounts receivable',
    category: 'Current Assets',
    parentCategory: 'Assets',
    applicableExpenseTypes: ['accounts receivable', 'receivables'],
    confidence: 1.0,
    source: 'CRA_OFFICIAL',
  },

  // Expenses
  {
    code: '8810',
    description: 'Office expenses',
    category: 'Operating Expenses',
    parentCategory: 'Expenses',
    applicableExpenseTypes: [
      'office supplies',
      'office equipment',
      'stationery',
      'printer supplies',
      'paper',
      'ink',
    ],
    confidence: 0.95,
    source: 'CRA_OFFICIAL',
  },
  {
    code: '8860',
    description: 'Rent',
    category: 'Operating Expenses',
    parentCategory: 'Expenses',
    applicableExpenseTypes: ['rent', 'lease', 'office rent', 'facility rent'],
    confidence: 0.95,
    source: 'CRA_OFFICIAL',
  },
  {
    code: '8870',
    description: 'Repairs and maintenance',
    category: 'Operating Expenses',
    parentCategory: 'Expenses',
    applicableExpenseTypes: [
      'repairs',
      'maintenance',
      'building maintenance',
      'equipment repair',
    ],
    confidence: 0.90,
    source: 'CRA_OFFICIAL',
  },
  {
    code: '8880',
    description: 'Utilities',
    category: 'Operating Expenses',
    parentCategory: 'Expenses',
    applicableExpenseTypes: [
      'electricity',
      'water',
      'gas',
      'heating',
      'internet',
      'phone',
      'utilities',
    ],
    confidence: 0.90,
    source: 'CRA_OFFICIAL',
  },
  {
    code: '8523',
    description: 'Meals and entertainment',
    category: 'Operating Expenses',
    parentCategory: 'Expenses',
    applicableExpenseTypes: [
      'meals',
      'entertainment',
      'restaurant',
      'catering',
      'business meal',
      'client entertainment',
      'food',
    ],
    confidence: 0.95,
    source: 'CRA_OFFICIAL',
  },
  {
    code: '8800',
    description: 'Salaries and wages',
    category: 'Operating Expenses',
    parentCategory: 'Expenses',
    applicableExpenseTypes: [
      'salary',
      'wages',
      'payroll',
      'employee compensation',
    ],
    confidence: 0.95,
    source: 'CRA_OFFICIAL',
  },
  {
    code: '8812',
    description: 'Insurance',
    category: 'Operating Expenses',
    parentCategory: 'Expenses',
    applicableExpenseTypes: [
      'insurance',
      'liability insurance',
      'property insurance',
      'business insurance',
    ],
    confidence: 0.90,
    source: 'CRA_OFFICIAL',
  },
  {
    code: '8850',
    description: 'Professional fees',
    category: 'Operating Expenses',
    parentCategory: 'Expenses',
    applicableExpenseTypes: [
      'legal fees',
      'accounting fees',
      'consulting fees',
      'professional services',
      'accountant',
      'lawyer',
    ],
    confidence: 0.90,
    source: 'CRA_OFFICIAL',
  },
  {
    code: '8862',
    description: 'Advertising and promotion',
    category: 'Operating Expenses',
    parentCategory: 'Expenses',
    applicableExpenseTypes: [
      'advertising',
      'marketing',
      'promotion',
      'online ads',
      'print ads',
    ],
    confidence: 0.90,
    source: 'CRA_OFFICIAL',
  },
  {
    code: '8872',
    description: 'Travel expenses',
    category: 'Operating Expenses',
    parentCategory: 'Expenses',
    applicableExpenseTypes: [
      'travel',
      'airfare',
      'hotel',
      'accommodation',
      'taxi',
      'rideshare',
    ],
    confidence: 0.90,
    source: 'CRA_OFFICIAL',
  },
  {
    code: '8900',
    description: 'Interest and bank charges',
    category: 'Financial Expenses',
    parentCategory: 'Expenses',
    applicableExpenseTypes: [
      'interest',
      'bank charges',
      'loan interest',
      'mortgage interest',
    ],
    confidence: 0.90,
    source: 'CRA_OFFICIAL',
  },
  {
    code: '8910',
    description: 'Bad debts',
    category: 'Financial Expenses',
    parentCategory: 'Expenses',
    applicableExpenseTypes: ['bad debt', 'write-off', 'uncollectible'],
    confidence: 0.85,
    source: 'CRA_OFFICIAL',
  },

  // Revenue
  {
    code: '8000',
    description: 'Sales',
    category: 'Revenue',
    parentCategory: 'Revenue',
    applicableExpenseTypes: ['sales', 'revenue', 'income'],
    confidence: 0.95,
    source: 'CRA_OFFICIAL',
  },
  {
    code: '8100',
    description: 'Professional fees income',
    category: 'Revenue',
    parentCategory: 'Revenue',
    applicableExpenseTypes: ['consulting income', 'service revenue', 'fees earned'],
    confidence: 0.90,
    source: 'CRA_OFFICIAL',
  },
];

/**
 * Get GIFI code by code string
 */
export function getGIFICode(code: string): GIFICode | undefined {
  return GIFI_CATALOGUE.find((g) => g.code === code);
}

/**
 * Get all GIFI codes
 */
export function getAllGIFICodes(): GIFICode[] {
  return [...GIFI_CATALOGUE];
}

/**
 * Get GIFI codes by category
 */
export function getGIFICodesByCategory(category: string): GIFICode[] {
  return GIFI_CATALOGUE.filter((g) => g.category === category);
}

/**
 * Get GIFI codes by parent category
 */
export function getGIFICodesByParentCategory(parentCategory: string): GIFICode[] {
  return GIFI_CATALOGUE.filter((g) => g.parentCategory === parentCategory);
}

/**
 * Check if a GIFI code exists in the catalogue
 */
export function isValidGIFICode(code: string): boolean {
  return GIFI_CATALOGUE.some((g) => g.code === code);
}
