import { getDb } from '@/db';
import { CRA_RULESET_VERSION } from '@/domain/cra/types';

/**
 * Simple UUID generator (avoiding external dependency for prototype)
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Audit Event Types
 */
export enum AuditEventType {
  RECEIPT_READ = 'receipt_read',
  DOCUMENTATION_VALIDATED = 'documentation_validated',
  GST_NUMBER_VALIDATED = 'gst_number_validated',
  ITC_CALCULATED = 'itc_calculated',
  EXPENSE_CLASSIFIED = 'expense_classified',
  GIFI_ASSIGNED = 'gifi_assigned',
  CLASSIFICATION_UPDATED = 'classification_updated',
  REVIEW_REQUESTED = 'review_requested',
  APPROVAL_GRANTED = 'approval_granted',
  APPROVAL_REJECTED = 'approval_rejected',
  AGENT_RUN_STARTED = 'agent_run_started',
  AGENT_RUN_COMPLETED = 'agent_run_completed',
  TOOL_EXECUTED = 'tool_executed',
  ERROR = 'error',
}

/**
 * Audit Logger
 * Records all meaningful agent and system actions for compliance and debugging
 */

export class AuditLogger {
  /**
   * Log an audit event
   */
  static log(params: {
    actor: 'agent' | 'user' | 'system';
    receiptId?: string;
    action: AuditEventType | string;
    details?: Record<string, any>;
    model?: string;
    status?: 'success' | 'error' | 'partial';
    error?: string;
  }): void {
    const db = getDb();

    const eventId = generateUUID();
    const timestamp = new Date().toISOString();

    // Create input and result hashes for integrity checking
    const inputHash = params.details ? this.createHash(JSON.stringify(params.details)) : null;
    const resultHash = params.details?.result ? this.createHash(JSON.stringify(params.details.result)) : null;

    const auditEvent = {
      id: generateUUID(),
      eventId,
      timestamp,
      actor: params.actor,
      receiptId: params.receiptId || null,
      action: params.action,
      inputHash,
      resultHash,
      ruleVersion: CRA_RULESET_VERSION,
      model: params.model || null,
      status: params.status || 'success',
      details: params.details ? JSON.stringify(params.details) : null,
      createdAt: timestamp,
    };

    db.addAuditEvent(auditEvent);
  }

  /**
   * Log a tool execution
   */
  static logToolExecution(params: {
    receiptId: string;
    toolName: string;
    input: any;
    output?: any;
    error?: string;
    latencyMs?: number;
    model?: string;
  }): void {
    this.log({
      actor: 'agent',
      receiptId: params.receiptId,
      action: AuditEventType.TOOL_EXECUTED,
      details: {
        toolName: params.toolName,
        input: this.sanitizeForLogging(params.input),
        output: params.output ? this.sanitizeForLogging(params.output) : undefined,
        error: params.error,
        latencyMs: params.latencyMs,
      },
      model: params.model,
      status: params.error ? 'error' : 'success',
    });
  }

  /**
   * Log an agent run
   */
  static logAgentRun(params: {
    receiptId: string;
    model: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    ttftMs?: number;
    totalLatencyMs?: number;
    toolCount?: number;
    error?: string;
  }): void {
    this.log({
      actor: 'agent',
      receiptId: params.receiptId,
      action: params.error ? AuditEventType.ERROR : AuditEventType.AGENT_RUN_COMPLETED,
      details: {
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        totalTokens: params.totalTokens,
        ttftMs: params.ttftMs,
        totalLatencyMs: params.totalLatencyMs,
        toolCount: params.toolCount,
      },
      model: params.model,
      status: params.error ? 'error' : 'success',
      error: params.error,
    });
  }

  /**
   * Get audit events for a receipt
   */
  static getAuditEvents(receiptId: string): any[] {
    const db = getDb();
    return db.getAuditEvents(receiptId);
  }

  /**
   * Get all audit events
   */
  static getAllAuditEvents(): any[] {
    const db = getDb();
    return db.getAuditEvents();
  }

  /**
   * Create a simple hash for integrity checking
   * Note: In production, use a proper cryptographic hash
   */
  private static createHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Sanitize data for logging (remove sensitive information)
   */
  private static sanitizeForLogging(data: any): any {
    if (!data) return data;

    if (typeof data === 'string') {
      // Redact GST numbers
      if (/^\d{9}RT\d{4}$/.test(data)) {
        return `************${data.substring(data.length - 4)}`;
      }
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeForLogging(item));
    }

    if (typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Skip sensitive fields
        if (key.toLowerCase().includes('password') || key.toLowerCase().includes('secret')) {
          continue;
        }
        sanitized[key] = this.sanitizeForLogging(value);
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Generate an audit report for a receipt
   */
  static generateAuditReport(receiptId: string): {
    receiptId: string;
    events: any[];
    summary: {
      totalEvents: number;
      toolExecutions: number;
      errors: number;
      firstEvent: string;
      lastEvent: string;
    };
  } {
    const events = this.getAuditEvents(receiptId);
    const toolExecutions = events.filter((e) => e.action === AuditEventType.TOOL_EXECUTED).length;
    const errors = events.filter((e) => e.status === 'error').length;

    return {
      receiptId,
      events,
      summary: {
        totalEvents: events.length,
        toolExecutions,
        errors,
        firstEvent: events[0]?.timestamp || '',
        lastEvent: events[events.length - 1]?.timestamp || '',
      },
    };
  }
}
