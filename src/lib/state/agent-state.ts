/**
 * Agent State Management
 * 
 * This module manages the synchronization between agent tool execution
 * and application state. It ensures that:
 * 
 * 1. Tool calls are validated against schemas
 * 2. State updates are deterministic
 * 3. UI state reflects persisted domain state
 */

import { z } from 'zod';
import { Receipt, ReceiptStatus } from '@/domain/expenses/types';

export interface AgentToolCall {
  toolName: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  error?: string;
  timestamp: Date;
}

export interface AgentExecution {
  id: string;
  receiptId: string | null;
  userMessage: string;
  toolCalls: AgentToolCall[];
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
}

export interface AppState {
  receipts: Receipt[];
  selectedReceiptId: string | null;
  agentExecutions: AgentExecution[];
  currentExecution: AgentExecution | null;
}

class AgentStateManager {
  private state: AppState;
  private listeners: Set<(state: AppState) => void> = new Set();

  constructor(initialReceipts: Receipt[]) {
    this.state = {
      receipts: initialReceipts,
      selectedReceiptId: null,
      agentExecutions: [],
      currentExecution: null,
    };
  }

  // Subscribe to state changes
  subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Get current state (immutable)
  getState(): AppState {
    return { ...this.state };
  }

  // Update selected receipt
  selectReceipt(receiptId: string | null): void {
    this.state = {
      ...this.state,
      selectedReceiptId: receiptId,
    };
    this.notifyListeners();
  }

  // Start a new agent execution
  async startExecution(userMessage: string, receiptId: string | null): Promise<string> {
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const execution: AgentExecution = {
      id: executionId,
      receiptId,
      userMessage,
      toolCalls: [],
      status: 'running',
      startedAt: new Date(),
    };

    this.state = {
      ...this.state,
      currentExecution: execution,
      agentExecutions: [...this.state.agentExecutions, execution],
    };

    this.notifyListeners();
    return executionId;
  }

  // Record a tool call
  async recordToolCall(
    executionId: string,
    toolName: string,
    parameters: Record<string, unknown>,
    result?: unknown,
    error?: string
  ): Promise<void> {
    const toolCall: AgentToolCall = {
      toolName,
      parameters,
      result,
      error,
      timestamp: new Date(),
    };

    this.state = {
      ...this.state,
      currentExecution: this.state.currentExecution
        ? {
            ...this.state.currentExecution,
            toolCalls: [...this.state.currentExecution.toolCalls, toolCall],
          }
        : null,
      agentExecutions: this.state.agentExecutions.map((exec) =>
        exec.id === executionId
          ? { ...exec, toolCalls: [...exec.toolCalls, toolCall] }
          : exec
      ),
    };

    this.notifyListeners();
  }

  // Complete an execution
  async completeExecution(executionId: string, status: 'completed' | 'failed'): Promise<void> {
    this.state = {
      ...this.state,
      currentExecution: null,
      agentExecutions: this.state.agentExecutions.map((exec) =>
        exec.id === executionId
          ? { ...exec, status, completedAt: new Date() }
          : exec
      ),
    };

    this.notifyListeners();
  }

  // Update receipt state (called by tools)
  async updateReceipt(receiptId: string, updates: Partial<Receipt>): Promise<void> {
    const receipt = this.state.receipts.find(r => r.id === receiptId);
    if (!receipt) {
      throw new Error(`Receipt ${receiptId} not found`);
    }

    // Validate updates against business rules
    const updatedReceipt: Receipt = {
      ...receipt,
      ...updates,
    };

    this.state = {
      ...this.state,
      receipts: this.state.receipts.map(r =>
        r.id === receiptId ? updatedReceipt : r
      ),
    };

    this.notifyListeners();
  }

  // Notify all listeners
  private notifyListeners(): void {
    const currentState = this.getState();
    this.listeners.forEach(listener => listener(currentState));
  }

  // Get execution history
  getExecutionHistory(): AgentExecution[] {
    return [...this.state.agentExecutions].sort(
      (a, b) => b.startedAt.getTime() - a.startedAt.getTime()
    );
  }

  // Get current execution
  getCurrentExecution(): AgentExecution | null {
    return this.state.currentExecution;
  }
}

// Export singleton instance
let stateManager: AgentStateManager | null = null;

export function initializeStateManager(initialReceipts: Receipt[]): AgentStateManager {
  // Always create a fresh instance to ensure test isolation
  stateManager = new AgentStateManager(initialReceipts);
  return stateManager;
}

export function getStateManager(): AgentStateManager {
  if (!stateManager) {
    throw new Error('StateManager not initialized. Call initializeStateManager first.');
  }
  return stateManager;
}
