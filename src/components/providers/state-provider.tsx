'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { MOCK_RECEIPTS } from '@/domain/expenses/mock-receipts';
import { initializeStateManager, getStateManager, AppState, AgentExecution } from '@/lib/state/agent-state';

interface StateContextType {
  state: AppState;
  selectReceipt: (receiptId: string | null) => void;
  getExecutionHistory: () => AgentExecution[];
  getCurrentExecution: () => AgentExecution | null;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export function StateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    receipts: MOCK_RECEIPTS,
    selectedReceiptId: null,
    agentExecutions: [],
    currentExecution: null,
  });

  useEffect(() => {
    // Initialize state manager on mount
    const stateManager = initializeStateManager(MOCK_RECEIPTS);
    
    // Subscribe to state changes
    const unsubscribe = stateManager.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const selectReceipt = (receiptId: string | null) => {
    const stateManager = getStateManager();
    stateManager.selectReceipt(receiptId);
  };

  const getExecutionHistory = () => {
    const stateManager = getStateManager();
    return stateManager.getExecutionHistory();
  };

  const getCurrentExecution = () => {
    const stateManager = getStateManager();
    return stateManager.getCurrentExecution();
  };

  return (
    <StateContext.Provider
      value={{
        state,
        selectReceipt,
        getExecutionHistory,
        getCurrentExecution,
      }}
    >
      {children}
    </StateContext.Provider>
  );
}

export function useStateContext() {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error('useStateContext must be used within a StateProvider');
  }
  return context;
}
