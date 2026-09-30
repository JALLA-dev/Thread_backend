"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { approveBooking, rejectBooking } from "@/lib/actions/approvals";
import { Check, X } from "lucide-react";

interface ApprovalActionsProps {
  bookingId: string;
}

export function ApprovalActions({ bookingId }: ApprovalActionsProps) {
  const [isPending, setIsPending] = useState(false);

  const handleApprove = async () => {
    setIsPending(true);
    const result = await approveBooking(bookingId);
    if (result?.error) {
      alert(result.error);
    }
    setIsPending(false);
  };

  const handleReject = async () => {
    setIsPending(true);
    const result = await rejectBooking(bookingId);
    if (result?.error) {
      alert(result.error);
    }
    setIsPending(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleReject}
        disabled={isPending}
        className="text-[var(--destructive)] hover:text-[var(--destructive)] hover:bg-[var(--destructive-light)] border-transparent"
      >
        <X className="h-4 w-4 mr-1" /> Reject
      </Button>
      <Button 
        variant="primary" 
        size="sm" 
        onClick={handleApprove}
        loading={isPending}
      >
        <Check className="h-4 w-4 mr-1" /> Approve
      </Button>
    </div>
  );
}
