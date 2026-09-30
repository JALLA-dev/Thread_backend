"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { cancelBooking } from "@/lib/actions/manage-booking";
import { Calendar, Clock, XCircle } from "lucide-react";

interface CancelBookingFormProps {
  booking: any;
}

export function CancelBookingForm({ booking }: CancelBookingFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async (formData: FormData) => {
    setIsPending(true);
    setError(null);
    
    const reason = formData.get("reason") as string;
    const result = await cancelBooking(booking.booking.id, reason);
    
    if (result.error) {
      setError(result.error);
      setIsPending(false);
    } else {
      setIsCancelled(true);
    }
  };

  if (isCancelled) {
    return (
      <Card padding="lg" className="max-w-xl mx-auto mt-12 text-center animate-scale-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--destructive-light)] mb-6">
          <XCircle className="h-8 w-8 text-[var(--destructive)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Booking Cancelled</h2>
        <p className="text-[var(--foreground-muted)] mb-6">
          Your meeting with {booking.host.name} has been cancelled. An email confirmation has been sent.
        </p>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto mt-12 overflow-hidden animate-fade-in">
      <div className="p-8 border-b border-[var(--border)] bg-[var(--background-subtle)] text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Cancel Event</h1>
        <p className="text-[var(--foreground-muted)]">
          Are you sure you want to cancel this meeting?
        </p>
      </div>

      <div className="p-8 space-y-6">
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background-subtle)]">
          <h3 className="font-semibold text-[var(--foreground)] mb-3">{booking.eventType.title}</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
              <Calendar className="h-4 w-4" />
              {new Date(booking.booking.startTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
              <Clock className="h-4 w-4" />
              {new Date(booking.booking.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        <form action={handleCancel} className="space-y-4">
          <Textarea
            label="Reason for cancelling (optional)"
            name="reason"
            rows={3}
            fullWidth
          />
          
          {error && (
            <div className="p-3 rounded-lg bg-[var(--destructive-light)] text-[var(--destructive)] text-sm font-medium">
              {error}
            </div>
          )}
          
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="destructive" type="submit" loading={isPending}>
              Cancel Meeting
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
