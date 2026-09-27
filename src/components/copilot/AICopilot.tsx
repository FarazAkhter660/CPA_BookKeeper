'use client';

import { useChat } from 'ai/react';
import { Receipt } from '@/domain/expenses/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AICopilotProps {
  selectedReceiptId: string | null;
  selectedReceipt: Receipt | null;
}

export default function AICopilot({
  selectedReceiptId,
  selectedReceipt,
}: AICopilotProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/agent',
    body: {
      selectedReceiptId: selectedReceiptId,
    },
    onResponse: (response) => {
      // Handle streaming response
      console.log('Streaming response received');
    },
    onFinish: (message) => {
      console.log('Agent finished:', message);
    },
    onError: (error) => {
      console.error('Agent error:', error);
    }
  });

  return (
    <div className="w-96 flex flex-col bg-muted/20">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">AI Copilot</h2>
        <p className="text-sm text-muted-foreground">Agent</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm">
            <p>Ask me to process the selected receipt</p>
            <p className="mt-2">Try: "Process this receipt"</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg ${
              msg.role === 'user' ? 'bg-primary text-primary-foreground ml-8' : 'bg-card mr-8'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            {msg.toolInvocations && msg.toolInvocations.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Tool calls:</p>
                {msg.toolInvocations.map((tool, toolIdx) => (
                  <div key={toolIdx} className="text-xs text-muted-foreground">
                    • {tool.toolName}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="bg-card p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Processing...</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="animate-pulse">●</span>
              <span>Agent is thinking and executing tools...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
