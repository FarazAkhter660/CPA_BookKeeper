import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initializeStateManager, getStateManager } from '@/lib/state/agent-state';
import { MOCK_RECEIPTS } from '@/domain/expenses/mock-receipts';
import { ReceiptStatus } from '@/domain/expenses/types';

describe('Agent Integration Tests', () => {
  beforeEach(() => {
    // Reset state manager for each test
    initializeStateManager(MOCK_RECEIPTS);
  });

  afterEach(() => {
    // Cleanup
  });

  describe('State Management Integration', () => {
    it('should initialize state manager with mock receipts', () => {
      const stateManager = getStateManager();
      const state = stateManager.getState();
      
      expect(state.receipts).toHaveLength(MOCK_RECEIPTS.length);
      expect(state.agentExecutions).toHaveLength(0);
      expect(state.currentExecution).toBeNull();
    });

    it('should handle receipt selection', () => {
      const stateManager = getStateManager();
      const receiptId = MOCK_RECEIPTS[0].id;
      
      stateManager.selectReceipt(receiptId);
      const state = stateManager.getState();
      
      expect(state.selectedReceiptId).toBe(receiptId);
    });

    it('should track agent execution lifecycle', async () => {
      const stateManager = getStateManager();
      
      const executionId = await stateManager.startExecution('Test message', MOCK_RECEIPTS[0].id);
      
      const currentExecution = stateManager.getCurrentExecution();
      expect(currentExecution).not.toBeNull();
      expect(currentExecution?.id).toBe(executionId);
      expect(currentExecution?.status).toBe('running');
      
      await stateManager.completeExecution(executionId, 'completed');
      
      const completedExecution = stateManager.getExecutionHistory()[0];
      expect(completedExecution.status).toBe('completed');
      expect(completedExecution.completedAt).not.toBeUndefined();
    });

    it('should record tool calls during execution', async () => {
      const stateManager = getStateManager();
      const executionId = await stateManager.startExecution('Test message', MOCK_RECEIPTS[0].id);
      
      await stateManager.recordToolCall(
        executionId,
        'test_tool',
        { param1: 'value1' },
        { result: 'success' }
      );
      
      const execution = stateManager.getCurrentExecution();
      expect(execution?.toolCalls).toHaveLength(1);
      expect(execution?.toolCalls[0].toolName).toBe('test_tool');
    });
  });

  describe('Receipt Processing Integration', () => {
    it('should update receipt state through state manager', async () => {
      const stateManager = getStateManager();
      const receiptId = MOCK_RECEIPTS[0].id;
      
      await stateManager.updateReceipt(receiptId, {
        status: ReceiptStatus.PROCESSED,
        category: 'Office Supplies',
      });
      
      const state = stateManager.getState();
      const updatedReceipt = state.receipts.find(r => r.id === receiptId);
      
      expect(updatedReceipt?.status).toBe(ReceiptStatus.PROCESSED);
      expect(updatedReceipt?.category).toBe('Office Supplies');
    });

    it('should handle multiple receipt updates', async () => {
      const stateManager = getStateManager();
      
      await stateManager.updateReceipt(MOCK_RECEIPTS[0].id, {
        status: ReceiptStatus.PROCESSED,
      });
      
      await stateManager.updateReceipt(MOCK_RECEIPTS[1].id, {
        status: ReceiptStatus.PROCESSED,
      });
      
      const state = stateManager.getState();
      const processedCount = state.receipts.filter(r => r.status === ReceiptStatus.PROCESSED).length;
      
      expect(processedCount).toBe(2);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid receipt ID in update', async () => {
      const stateManager = getStateManager();
      
      await expect(
        stateManager.updateReceipt('invalid-id', { status: ReceiptStatus.PROCESSED })
      ).rejects.toThrow('Receipt invalid-id not found');
    });
  });
});
