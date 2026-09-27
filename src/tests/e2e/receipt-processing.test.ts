import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeStateManager, getStateManager } from '@/lib/state/agent-state';
import { MOCK_RECEIPTS } from '@/domain/expenses/mock-receipts';
import { ReceiptStatus } from '@/domain/expenses/types';
import { DocumentationRules, DocumentationStatus, DocumentationTier } from '@/domain/cra';
import { ITCRules, ITCStatus } from '@/domain/cra';
import { Money } from '@/domain/money/Money';

describe('E2E Receipt Processing Workflow', () => {
  beforeAll(() => {
    initializeStateManager(MOCK_RECEIPTS);
  });

  afterAll(() => {
    // Cleanup
  });

  describe('Complete Receipt Processing Flow', () => {
    it('should process a standard office supplies receipt end-to-end', async () => {
      const stateManager = getStateManager();
      const receipt = MOCK_RECEIPTS.find(r => r.id === 'receipt_001');
      
      expect(receipt).toBeDefined();
      
      // Step 1: Select receipt
      stateManager.selectReceipt(receipt!.id);
      let state = stateManager.getState();
      expect(state.selectedReceiptId).toBe('001');
      
      // Step 2: Validate documentation
      const docValidation = DocumentationRules.validateDocumentation({
        amount: new Money(receipt!.total),
        vendorName: receipt!.vendor,
        date: receipt!.date,
        gstNumber: receipt!.gstNumber,
        description: receipt!.description,
      });
      
      expect(docValidation.status).toBe(DocumentationStatus.SUFFICIENT);
      expect(docValidation.tier).toBe(DocumentationTier.TIER_2);
      
      // Step 3: Calculate ITC
      const itcResult = ITCRules.calculateEligibleITC({
        subtotal: new Money(receipt!.subtotal),
        taxAmount: new Money(receipt!.taxAmount),
        taxType: receipt!.taxType as any,
        expenseCategory: receipt!.category || 'Office Supplies',
        commercialUsePercentage: receipt!.commercialUsePercentage,
        mealEntertainment: receipt!.category?.toLowerCase().includes('meal') || false,
        documentationStatus: docValidation.status,
        documentationTier: docValidation.tier,
      });
      
      expect(itcResult.status).toBe(ITCStatus.ELIGIBLE);
      expect(itcResult.eligibleITC.toNumber()).toBeGreaterThan(0);
      
      // Step 4: Update receipt state
      await stateManager.updateReceipt(receipt!.id, {
        status: ReceiptStatus.PROCESSED,
        category: 'Office Supplies',
      });
      
      state = stateManager.getState();
      const updatedReceipt = state.receipts.find(r => r.id === 'receipt_001');
      expect(updatedReceipt?.status).toBe(ReceiptStatus.PROCESSED);
    });

    it('should handle a meals receipt with 50% ITC restriction', async () => {
      const stateManager = getStateManager();
      const receipt = MOCK_RECEIPTS.find(r => r.id === 'receipt_004'); // Client lunch
      
      expect(receipt).toBeDefined();
      
      // Validate documentation
      const docValidation = DocumentationRules.validateDocumentation({
        amount: new Money(receipt!.total),
        vendorName: receipt!.vendor,
        date: receipt!.date,
        gstNumber: receipt!.gstNumber,
        description: receipt!.description,
      });
      
      expect(docValidation.status).toBe(DocumentationStatus.SUFFICIENT);
      
      // Calculate ITC with meals restriction
      const itcResult = ITCRules.calculateEligibleITC({
        subtotal: new Money(receipt!.subtotal),
        taxAmount: new Money(receipt!.taxAmount),
        taxType: receipt!.taxType as any,
        expenseCategory: 'Meals & Entertainment',
        commercialUsePercentage: receipt!.commercialUsePercentage,
        mealEntertainment: true,
        documentationStatus: docValidation.status,
        documentationTier: docValidation.tier,
      });
      
      expect(itcResult.status).toBe(ITCStatus.PARTIAL);
      expect(itcResult.eligibilityPercentage).toBe(0.5); // 50% ITC
      expect(itcResult.ruleApplied).toBe('MEAL_ENTERTAINMENT_RESTRICTION');
    });

    it('should reject receipt with insufficient documentation', async () => {
      const receipt = MOCK_RECEIPTS.find(r => r.id === 'receipt_005'); // Missing GST number
      
      expect(receipt).toBeDefined();
      
      // Validate documentation
      const docValidation = DocumentationRules.validateDocumentation({
        amount: new Money(receipt!.total),
        vendorName: receipt!.vendor,
        date: receipt!.date,
        gstNumber: receipt!.gstNumber,
        description: receipt!.description,
      });
      
      expect(docValidation.status).toBe(DocumentationStatus.INSUFFICIENT);
      expect(docValidation.missingFields).toContain('gstNumber');
      
      // Calculate ITC - should be ineligible
      const itcResult = ITCRules.calculateEligibleITC({
        subtotal: new Money(receipt!.subtotal),
        taxAmount: new Money(receipt!.taxAmount),
        taxType: receipt!.taxType as any,
        expenseCategory: receipt!.category || 'Office Supplies',
        commercialUsePercentage: receipt!.commercialUsePercentage,
        mealEntertainment: false,
        documentationStatus: docValidation.status,
        documentationTier: docValidation.tier,
      });
      
      expect(itcResult.status).toBe(ITCStatus.INELIGIBLE);
      expect(itcResult.eligibleITC.isZero()).toBe(true);
      expect(itcResult.reasonCode).toBe('INSUFFICIENT_DOCUMENTATION');
    });
  });

  describe('Agent Execution E2E', () => {
    it('should complete full agent execution lifecycle', async () => {
      const stateManager = getStateManager();
      const receipt = MOCK_RECEIPTS[0];
      
      // Start execution
      const executionId = await stateManager.startExecution(
        'Process this receipt',
        receipt.id
      );
      
      let execution = stateManager.getCurrentExecution();
      expect(execution?.status).toBe('running');
      
      // Simulate tool calls
      await stateManager.recordToolCall(executionId, 'get_current_receipt', {}, receipt);
      await stateManager.recordToolCall(executionId, 'validate_cra_documentation', { receiptId: receipt.id }, {
        tier: DocumentationTier.TIER_2,
        status: DocumentationStatus.SUFFICIENT,
        missingFields: [],
      });
      await stateManager.recordToolCall(executionId, 'calculate_eligible_itc', { receiptId: receipt.id }, {
        eligibleITC: new Money(receipt.taxAmount),
        eligibilityPercentage: 1,
        status: ITCStatus.ELIGIBLE,
      });
      
      // Complete execution
      await stateManager.completeExecution(executionId, 'completed');
      
      // Verify execution history
      const history = stateManager.getExecutionHistory();
      const completedExecution = history[0];
      
      expect(completedExecution.status).toBe('completed');
      expect(completedExecution.toolCalls).toHaveLength(3);
      expect(completedExecution.completedAt).not.toBeUndefined();
    });
  });

  describe('Error Recovery E2E', () => {
    it('should handle tool failure during execution', async () => {
      const stateManager = getStateManager();
      const receipt = MOCK_RECEIPTS[0];
      
      const executionId = await stateManager.startExecution('Process this receipt', receipt.id);
      
      // Record successful tool call
      await stateManager.recordToolCall(executionId, 'get_current_receipt', {}, receipt);
      
      // Record failed tool call
      await stateManager.recordToolCall(
        executionId,
        'validate_cra_documentation',
        { receiptId: receipt.id },
        undefined,
        'Validation failed'
      );
      
      // Complete as failed
      await stateManager.completeExecution(executionId, 'failed');
      
      const history = stateManager.getExecutionHistory();
      const failedExecution = history[0];
      
      expect(failedExecution.status).toBe('failed');
      expect(failedExecution.toolCalls[1].error).toBe('Validation failed');
    });
  });

  describe('State Consistency E2E', () => {
    it('should maintain state consistency across multiple operations', async () => {
      const stateManager = getStateManager();
      
      // Process multiple receipts
      for (let i = 0; i < 3; i++) {
        const receipt = MOCK_RECEIPTS[i];
        stateManager.selectReceipt(receipt.id);
        
        const executionId = await stateManager.startExecution('Process receipt', receipt.id);
        await stateManager.recordToolCall(executionId, 'get_current_receipt', {}, receipt);
        await stateManager.completeExecution(executionId, 'completed');
        
        await stateManager.updateReceipt(receipt.id, {
          status: ReceiptStatus.PROCESSED,
        });
      }
      
      // Verify final state
      const state = stateManager.getState();
      expect(state.agentExecutions).toHaveLength(3);
      expect(state.receipts.filter(r => r.status === ReceiptStatus.PROCESSED)).toHaveLength(3);
      
      // All executions should be completed
      state.agentExecutions.forEach(exec => {
        expect(exec.status).toBe('completed');
      });
    });
  });
});
