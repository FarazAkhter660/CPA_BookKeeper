import { MOCK_RECEIPTS } from '../domain/expenses/mock-receipts';
import { Receipt, ReceiptStatus, ProcessingStage } from '../domain/expenses/types';
import { ExpenseAnalysis, ToolExecutionState, ApprovalRequest } from '../domain/expenses/types';
import { AuditEvent } from './schema';

/**
 * In-memory database for prototype
 * Note: For production, this should be replaced with PostgreSQL or another production-grade database
 * Using in-memory storage avoids native dependency issues on Windows during development
 */

class InMemoryDatabase {
  private receipts: Map<string, Receipt> = new Map();
  private expenses: Map<string, ExpenseAnalysis> = new Map();
  private auditEvents: AuditEvent[] = [];
  private approvals: Map<string, ApprovalRequest> = new Map();
  private toolExecutions: Map<string, ToolExecutionState[]> = new Map();

  constructor() {
    // Initialize with mock data
    MOCK_RECEIPTS.forEach((receipt) => {
      this.receipts.set(receipt.id, { ...receipt });
    });
  }

  // Receipt operations
  getReceipt(id: string): Receipt | undefined {
    return this.receipts.get(id);
  }

  getAllReceipts(): Receipt[] {
    return Array.from(this.receipts.values());
  }

  updateReceipt(id: string, updates: Partial<Receipt>): Receipt | undefined {
    const receipt = this.receipts.get(id);
    if (!receipt) return undefined;
    
    const updated = { ...receipt, ...updates, updatedAt: new Date().toISOString() };
    this.receipts.set(id, updated);
    return updated;
  }

  // Expense operations
  saveExpense(expense: ExpenseAnalysis): void {
    this.expenses.set(expense.receiptId, expense);
  }

  getExpense(receiptId: string): ExpenseAnalysis | undefined {
    return this.expenses.get(receiptId);
  }

  // Audit operations
  addAuditEvent(event: AuditEvent): void {
    this.auditEvents.push(event);
  }

  getAuditEvents(receiptId?: string): AuditEvent[] {
    if (receiptId) {
      return this.auditEvents.filter((e) => e.receiptId === receiptId);
    }
    return [...this.auditEvents];
  }

  // Approval operations
  saveApproval(approval: ApprovalRequest): void {
    this.approvals.set(approval.receiptId, approval);
  }

  getApproval(receiptId: string): ApprovalRequest | undefined {
    return this.approvals.get(receiptId);
  }

  // Tool execution tracking
  addToolExecution(receiptId: string, execution: ToolExecutionState): void {
    if (!this.toolExecutions.has(receiptId)) {
      this.toolExecutions.set(receiptId, []);
    }
    this.toolExecutions.get(receiptId)!.push(execution);
  }

  getToolExecutions(receiptId: string): ToolExecutionState[] {
    return this.toolExecutions.get(receiptId) || [];
  }

  clearToolExecutions(receiptId: string): void {
    this.toolExecutions.delete(receiptId);
  }
}

// Singleton instance
const db = new InMemoryDatabase();

/**
 * Initialize database
 */
export async function initializeDatabase() {
  console.log('In-memory database initialized with mock data');
}

/**
 * Get database instance
 */
export function getDb(): InMemoryDatabase {
  return db;
}

/**
 * Close database (no-op for in-memory)
 */
export function closeDatabase() {
  // No-op for in-memory database
}
