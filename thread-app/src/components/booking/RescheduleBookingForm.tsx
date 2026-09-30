"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Calendar as CalendarIcon, Clock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { getAvailableSlots } from "@/lib/actions/booking";
import { rescheduleBooking } from "@/lib/actions/manage-booking";
import { cn } from "@/lib/utils";

interface RescheduleBookingFormProps {
  booking: any;
}

export function RescheduleBookingForm({ booking }: RescheduleBookingFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isRescheduled, setIsRescheduled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  useEffect(() => {
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split("T")[0];
      getAvailableSlots(booking.host.id, booking.eventType.id, dateStr).then(slots => {
        setAvailableSlots(slots);
        setSelectedTime(null);
      });
    }
  }, [selectedDate, booking.host.id, booking.eventType.id]);

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) return;
    
    setIsPending(true);
    setError(null);
    
    const dateStr = selectedDate.toISOString().split("T")[0];
    const result = await rescheduleBooking(booking.booking.id, dateStr, selectedTime);
    
    if (result.error) {
      setError(result.error);
      setIsPending(false);
    } else {
      setIsRescheduled(true);
    }
  };

  if (isRescheduled) {
    return (
      <Card padding="lg" className="max-w-xl mx-auto mt-12 text-center animate-scale-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success-light)] mb-6">
          <CheckCircle2 className="h-8 w-8 text-[var(--success)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Booking Rescheduled</h2>
        <p className="text-[var(--foreground-muted)] mb-6">
          Your meeting has been successfully rescheduled.
        </p>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto mt-12 overflow-hidden flex flex-col md:flex-row min-h-[600px] border-[var(--border)] shadow-lg animate-fade-in">
      <div className="w-full md:w-1/3 p-8 border-b md:border-b-0 md:border-r border-[var(--border)] bg-[var(--background-subtle)] flex flex-col">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Reschedule Event</h1>
        <p className="text-[var(--foreground-muted)] mb-6 text-sm">
          Select a new date and time for your meeting with {booking.host.name}.
        </p>
        
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] mb-6 opacity-70">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase mb-2">Previous Time</p>
          <div className="flex items-center gap-2 text-sm text-[var(--foreground)] mb-1">
            <CalendarIcon className="h-4 w-4" />
            {new Date(booking.booking.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--foreground)]">
            <Clock className="h-4 w-4" />
            {new Date(booking.booking.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      <div className="w-full md:w-2/3 p-8 bg-[var(--card)] flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">Select a New Date</h2>
          <div className="grid grid-cols-7 gap-1 text-center mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-xs font-medium text-[var(--foreground-muted)] py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: days[0].getDay() }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map((date, i) => (
              <button
                key={i}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "aspect-square rounded-full flex items-center justify-center text-sm transition-all",
                  selectedDate?.toDateString() === date.toDateString()
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold shadow-md" 
                    : "hover:bg-[var(--background-muted)] bg-[var(--background-subtle)] text-[var(--foreground)] font-medium"
                )}
              >
                {date.getDate()}
              </button>
            ))}
          </div>
        </div>

        {selectedDate && (
          <div className="w-full md:w-48 flex flex-col border-t md:border-t-0 md:border-l border-[var(--border)] pt-6 md:pt-0 md:pl-6 animate-slide-in-right">
            <p className="mb-4 text-sm font-medium text-[var(--foreground)] text-center">
              {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[300px]">
              {availableSlots.length === 0 ? (
                <p className="text-sm text-[var(--foreground-muted)] text-center py-4">No times available</p>
              ) : (
                availableSlots.map((time) => (
                  <div key={time} className="flex gap-2">
                    <Button
                      variant={selectedTime === time ? "primary" : "outline"}
                      className={cn("flex-1 transition-all", selectedTime === time ? "w-1/2" : "w-full")}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Button>
                    {selectedTime === time && (
                      <Button
                        variant="primary"
                        className="w-1/2 animate-scale-in"
                        onClick={handleReschedule}
                        loading={isPending}
                      >
                        Confirm
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
            {error && (
              <div className="mt-4 p-2 rounded-lg bg-[var(--destructive-light)] text-[var(--destructive)] text-xs font-medium">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
