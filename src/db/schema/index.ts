import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Database Schema
 * Using SQLite for prototype, can be migrated to PostgreSQL for production
 */

export const receipts = sqliteTable('receipts', {
  id: text('id').primaryKey(),
  vendor: text('vendor').notNull(),
  date: text('date').notNull(),
  subtotal: real('subtotal').notNull(),
  taxAmount: real('tax_amount').notNull(),
  total: real('total').notNull(),
  taxType: text('tax_type').notNull(), // 'GST' | 'HST'
  gstNumber: text('gst_number'),
  description: text('description'),
  category: text('category'),
  commercialUsePercentage: integer('commercial_use_percentage').notNull(),
  status: text('status').notNull(), // 'pending' | 'processing' | 'processed' | 'review_required' | 'approved' | 'rejected'
  processingStage: text('processing_stage'),
  receiptImage: text('receipt_image'),
  notes: text('notes'),
  customerInfo: text('customer_info'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  receiptId: text('receipt_id').notNull().references(() => receipts.id),
  category: text('category').notNull(),
  gifiCode: text('gifi_code').notNull(),
  gifiDescription: text('gifi_description').notNull(),
  gifiConfidence: real('gifi_confidence').notNull(),
  eligibleITC: real('eligible_itc').notNull(),
  grossTax: real('gross_tax').notNull(),
  eligibilityPercentage: real('eligibility_percentage').notNull(),
  documentationStatus: text('documentation_status').notNull(),
  documentationTier: text('documentation_tier').notNull(),
  itcStatus: text('itc_status').notNull(),
  reason: text('reason').notNull(),
  ruleApplied: text('rule_applied').notNull(),
  requiresApproval: integer('requires_approval', { mode: 'boolean' }).notNull(),
  confidence: text('confidence').notNull(), // 'high' | 'medium' | 'low'
  timestamp: text('timestamp').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const auditEvents = sqliteTable('audit_events', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().unique(),
  timestamp: text('timestamp').notNull(),
  actor: text('actor').notNull(), // 'agent' | 'user' | 'system'
  receiptId: text('receipt_id').references(() => receipts.id),
  action: text('action').notNull(),
  inputHash: text('input_hash'),
  resultHash: text('result_hash'),
  ruleVersion: text('rule_version').notNull(),
  model: text('model'),
  status: text('status').notNull(), // 'success' | 'error' | 'partial'
  details: text('details'), // JSON string
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const approvals = sqliteTable('approvals', {
  id: text('id').primaryKey(),
  receiptId: text('receipt_id').notNull().references(() => receipts.id),
  proposedCategory: text('proposed_category').notNull(),
  proposedGifiCode: text('proposed_gifi_code').notNull(),
  proposedITC: real('proposed_itc').notNull(),
  reason: text('reason').notNull(),
  requestedAt: text('requested_at').notNull(),
  status: text('status').notNull(), // 'pending' | 'approved' | 'rejected' | 'modified'
  approvedBy: text('approved_by'),
  approvedAt: text('approved_at'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const agentRuns = sqliteTable('agent_runs', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull().unique(),
  receiptId: text('receipt_id').references(() => receipts.id),
  startTime: text('start_time').notNull(),
  endTime: text('end_time'),
  status: text('status').notNull(), // 'running' | 'completed' | 'error' | 'interrupted'
  model: text('model'),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  totalTokens: integer('total_tokens'),
  ttftMs: integer('ttft_ms'), // Time to first token
  totalLatencyMs: integer('total_latency_ms'),
  toolCalls: integer('tool_calls'),
  toolErrors: integer('tool_errors'),
  error: text('error'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const toolCalls = sqliteTable('tool_calls', {
  id: text('id').primaryKey(),
  agentRunId: text('agent_run_id').references(() => agentRuns.id),
  toolName: text('tool_name').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time'),
  status: text('status').notNull(), // 'pending' | 'running' | 'completed' | 'error'
  input: text('input'), // JSON string
  output: text('output'), // JSON string
  error: text('error'),
  latencyMs: integer('latency_ms'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Receipt = typeof receipts.$inferSelect;
export type NewReceipt = typeof receipts.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type AuditEvent = typeof auditEvents.$inferSelect;
export type NewAuditEvent = typeof auditEvents.$inferInsert;
export type Approval = typeof approvals.$inferSelect;
export type NewApproval = typeof approvals.$inferInsert;
export type AgentRun = typeof agentRuns.$inferSelect;
export type NewAgentRun = typeof agentRuns.$inferInsert;
export type ToolCall = typeof toolCalls.$inferSelect;
export type NewToolCall = typeof toolCalls.$inferInsert;
