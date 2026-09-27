'use client';

import { Receipt } from '@/domain/expenses/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStateContext } from '@/components/providers/state-provider';

export default function ReceiptDetails() {
  const { state } = useStateContext();
  const receipt = state.selectedReceiptId 
    ? state.receipts.find(r => r.id === state.selectedReceiptId) || null
    : null;

  if (!receipt) {
    return (
      <div className="flex-1 border-r border-border flex items-center justify-center bg-muted/20">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">No receipt selected</p>
          <p className="text-sm">Select a receipt from the queue to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 border-r border-border flex flex-col bg-background">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold mb-1">Receipt</h2>
        <p className="text-sm text-muted-foreground">{receipt.id}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendor Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Vendor</label>
              <p className="font-medium">{receipt.vendor}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Date</label>
              <p className="font-medium">{receipt.date}</p>
            </div>
            {receipt.gstNumber && (
              <div>
                <label className="text-sm text-muted-foreground">GST/HST Number</label>
                <p className="font-medium font-mono">{receipt.gstNumber}</p>
              </div>
            )}
            {receipt.description && (
              <div>
                <label className="text-sm text-muted-foreground">Description</label>
                <p className="font-medium">{receipt.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Financial Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">${receipt.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{receipt.taxType}</span>
              <span className="font-medium">${receipt.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-4">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">${receipt.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Commercial Use</span>
              <span className="font-medium">{receipt.commercialUsePercentage}%</span>
            </div>
          </CardContent>
        </Card>

        {receipt.category && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Classification</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="text-sm text-muted-foreground">Category</label>
                <p className="font-medium">{receipt.category}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 flex gap-2">
          <Button variant="outline" className="flex-1">
            Edit
          </Button>
          <Button variant="default" className="flex-1">
            Approve
          </Button>
        </div>
      </div>
    </div>
  );
}
