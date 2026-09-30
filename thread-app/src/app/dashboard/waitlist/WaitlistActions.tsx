"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { removeWaitlistEntry, promoteWaitlistEntry } from "@/lib/actions/waitlist";

export function WaitlistActions({ entryId }: { entryId: string }) {
  const [loading, setLoading] = useState<"promote" | "remove" | null>(null);

  const handlePromote = async () => {
    setLoading("promote");
    await promoteWaitlistEntry(entryId);
    setLoading(null);
  };

  const handleRemove = async () => {
    setLoading("remove");
    await removeWaitlistEntry(entryId);
    setLoading(null);
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handlePromote} 
        loading={loading === "promote"}
      >
        Promote
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleRemove} 
        loading={loading === "remove"}
        className="text-[var(--destructive)] hover:bg-[var(--destructive-light)]"
      >
        Remove
      </Button>
    </div>
  );
}
