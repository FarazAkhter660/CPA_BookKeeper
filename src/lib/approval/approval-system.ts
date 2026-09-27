/**
 * Human-in-the-Loop Approval System
 * 
 * This system provides a mechanism for requiring human approval
 * for high-impact actions, following OWASP guidelines for
 * minimizing excessive agency in AI systems.
 */

export enum ApprovalAction {
  MODIFY_FINANCIAL_STATE = 'modify_financial_state',
  APPROVE_LARGE_AMOUNT = 'approve_large_amount',
  APPROVE_AMBIGUOUS_RECEIPT = 'approve_ambiguous_receipt',
  OVERRIDE_VALIDATION = 'override_validation',
  BULK_OPERATION = 'bulk_operation',
  DELETE_DATA = 'delete_data',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export interface ApprovalRequest {
  id: string;
  action: ApprovalAction;
  userId: string;
  timestamp: Date;
  description: string;
  details: Record<string, unknown>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  expiresAt?: Date;
}

export interface ApprovalDecision {
  requestId: string;
  status: ApprovalStatus;
  userId: string;
  timestamp: Date;
  reason?: string;
}

/**
 * Approval threshold configuration
 */
const APPROVAL_THRESHOLDS: Record<ApprovalAction, {
  requiresApproval: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  autoApproveAfter?: number; // minutes
}> = {
  [ApprovalAction.MODIFY_FINANCIAL_STATE]: {
    requiresApproval: true,
    riskLevel: 'high',
  },
  [ApprovalAction.APPROVE_LARGE_AMOUNT]: {
    requiresApproval: true,
    riskLevel: 'critical',
  },
  [ApprovalAction.APPROVE_AMBIGUOUS_RECEIPT]: {
    requiresApproval: true,
    riskLevel: 'medium',
  },
  [ApprovalAction.OVERRIDE_VALIDATION]: {
    requiresApproval: true,
    riskLevel: 'critical',
  },
  [ApprovalAction.BULK_OPERATION]: {
    requiresApproval: true,
    riskLevel: 'high',
  },
  [ApprovalAction.DELETE_DATA]: {
    requiresApproval: true,
    riskLevel: 'critical',
  },
};

/**
 * Amount thresholds for large transaction approval
 */
const LARGE_AMOUNT_THRESHOLD = 1000; // $1000 CAD

/**
 * Approval system class
 */
export class ApprovalSystem {
  private pendingApprovals: Map<string, ApprovalRequest> = new Map();
  private approvalHistory: ApprovalDecision[] = [];

  /**
   * Check if an action requires approval
   */
  requiresApproval(action: ApprovalAction, details?: Record<string, unknown>): boolean {
    const config = APPROVAL_THRESHOLDS[action];
    
    if (!config.requiresApproval) {
      return false;
    }

    // Additional checks based on details
    if (action === ApprovalAction.APPROVE_LARGE_AMOUNT && details) {
      const amount = details.amount as number | undefined;
      if (amount && amount < LARGE_AMOUNT_THRESHOLD) {
        return false; // Auto-approve amounts below threshold
      }
    }

    return true;
  }

  /**
   * Create an approval request
   */
  createApprovalRequest(
    action: ApprovalAction,
    userId: string,
    description: string,
    details: Record<string, unknown>
  ): ApprovalRequest {
    const config = APPROVAL_THRESHOLDS[action];
    
    const request: ApprovalRequest = {
      id: `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      userId,
      timestamp: new Date(),
      description,
      details,
      riskLevel: config.riskLevel,
      expiresAt: config.autoApproveAfter 
        ? new Date(Date.now() + config.autoApproveAfter * 60 * 1000)
        : undefined,
    };

    this.pendingApprovals.set(request.id, request);
    return request;
  }

  /**
   * Get pending approval request
   */
  getApprovalRequest(requestId: string): ApprovalRequest | undefined {
    return this.pendingApprovals.get(requestId);
  }

  /**
   * Get all pending approvals for a user
   */
  getPendingApprovals(userId: string): ApprovalRequest[] {
    return Array.from(this.pendingApprovals.values())
      .filter(req => req.userId === userId);
  }

  /**
   * Approve a request
   */
  approveRequest(requestId: string, userId: string, reason?: string): ApprovalDecision {
    const request = this.pendingApprovals.get(requestId);
    if (!request) {
      throw new Error(`Approval request ${requestId} not found`);
    }

    const decision: ApprovalDecision = {
      requestId,
      status: ApprovalStatus.APPROVED,
      userId,
      timestamp: new Date(),
      reason,
    };

    this.pendingApprovals.delete(requestId);
    this.approvalHistory.push(decision);
    return decision;
  }

  /**
   * Reject a request
   */
  rejectRequest(requestId: string, userId: string, reason?: string): ApprovalDecision {
    const request = this.pendingApprovals.get(requestId);
    if (!request) {
      throw new Error(`Approval request ${requestId} not found`);
    }

    const decision: ApprovalDecision = {
      requestId,
      status: ApprovalStatus.REJECTED,
      userId,
      timestamp: new Date(),
      reason,
    };

    this.pendingApprovals.delete(requestId);
    this.approvalHistory.push(decision);
    return decision;
  }

  /**
   * Cancel a request
   */
  cancelRequest(requestId: string, userId: string): ApprovalDecision {
    const request = this.pendingApprovals.get(requestId);
    if (!request) {
      throw new Error(`Approval request ${requestId} not found`);
    }

    if (request.userId !== userId) {
      throw new Error('Only the requester can cancel the approval');
    }

    const decision: ApprovalDecision = {
      requestId,
      status: ApprovalStatus.CANCELLED,
      userId,
      timestamp: new Date(),
    };

    this.pendingApprovals.delete(requestId);
    this.approvalHistory.push(decision);
    return decision;
  }

  /**
   * Check if a request has expired
   */
  isExpired(requestId: string): boolean {
    const request = this.pendingApprovals.get(requestId);
    if (!request || !request.expiresAt) {
      return false;
    }
    return new Date() > request.expiresAt;
  }

  /**
   * Clean up expired requests
   */
  cleanupExpiredRequests(): number {
    let cleaned = 0;
    for (const [id, request] of this.pendingApprovals.entries()) {
      if (request.expiresAt && new Date() > request.expiresAt) {
        this.pendingApprovals.delete(id);
        cleaned++;
      }
    }
    return cleaned;
  }

  /**
   * Get approval history
   */
  getApprovalHistory(userId?: string): ApprovalDecision[] {
    if (userId) {
      return this.approvalHistory.filter(dec => dec.userId === userId);
    }
    return [...this.approvalHistory];
  }

  /**
   * Get risk level for an action
   */
  getRiskLevel(action: ApprovalAction): 'low' | 'medium' | 'high' | 'critical' {
    return APPROVAL_THRESHOLDS[action].riskLevel;
  }

  /**
   * Check if user can approve this request
   */
  canApprove(requestId: string, userId: string): boolean {
    const request = this.pendingApprovals.get(requestId);
    if (!request) {
      return false;
    }

    // User cannot approve their own requests for high-risk actions
    if (request.userId === userId && request.riskLevel === 'critical') {
      return false;
    }

    return true;
  }
}

// Export singleton instance
let approvalSystem: ApprovalSystem | null = null;

export function getApprovalSystem(): ApprovalSystem {
  if (!approvalSystem) {
    approvalSystem = new ApprovalSystem();
  }
  return approvalSystem;
}

/**
 * Helper function to check if financial modification requires approval
 */
export function requiresFinancialApproval(amount: number, action: string): boolean {
  if (amount >= LARGE_AMOUNT_THRESHOLD) {
    return true;
  }

  // High-risk actions always require approval
  const highRiskActions = ['delete', 'override', 'bulk'];
  if (highRiskActions.some(risk => action.toLowerCase().includes(risk))) {
    return true;
  }

  return false;
}

/**
 * Helper function to create approval request for receipt processing
 */
export function createReceiptApprovalRequest(
  userId: string,
  receiptId: string,
  amount: number,
  isAmbiguous: boolean
): ApprovalRequest | null {
  const approvalSystem = getApprovalSystem();

  // Check if approval is required
  if (amount >= LARGE_AMOUNT_THRESHOLD) {
    return approvalSystem.createApprovalRequest(
      ApprovalAction.APPROVE_LARGE_AMOUNT,
      userId,
      `Process receipt ${receiptId} for $${amount.toFixed(2)}`,
      { receiptId, amount }
    );
  }

  if (isAmbiguous) {
    return approvalSystem.createApprovalRequest(
      ApprovalAction.APPROVE_AMBIGUOUS_RECEIPT,
      userId,
      `Review ambiguous receipt ${receiptId}`,
      { receiptId, amount }
    );
  }

  return null;
}
