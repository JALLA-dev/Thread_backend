"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Calendar as CalendarIcon, Clock, Globe, ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { createBooking } from "@/lib/actions/booking";
import { cn } from "@/lib/utils";
import { AIBookingAssistant } from "./AIBookingAssistant";

interface BookingFormProps {
  user: {
    id: string;
    name: string | null;
  };
  event: {
    id: string;
    title: string;
    durationMinutes: number;
    description: string | null;
    metadata?: any;
  };
}

export function BookingForm({ user, event }: BookingFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<{iso: string, formatted: string}[]>([]);
  const [selectedTime, setSelectedTime] = useState<{iso: string, formatted: string} | null>(null);
  const [step, setStep] = useState<"calendar" | "ai" | "form" | "success">("calendar");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableServices: any[] = event.metadata?.services || [];
  const [selectedServices, setSelectedServices] = useState<any[]>([]);

  const totalDuration = event.durationMinutes + selectedServices.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

  // Generate next 14 days for the simple calendar
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  useEffect(() => {
    if (selectedDate && step === "calendar") {
      // Fetch available slots for this date
      const dateStr = selectedDate.toISOString().split("T")[0];
      
      const fetchSlots = async () => {
        try {
          const res = await fetch(`/api/booking-slots?eventTypeId=${event.id}&date=${dateStr}&timeZone=${Intl.DateTimeFormat().resolvedOptions().timeZone}&duration=${totalDuration}`);
          const data = await res.json();
          if (res.ok && data.slots) {
            const slotsWithIso = data.slots.map((s: {start: string}) => {
              const d = new Date(s.start);
              return {
                iso: s.start,
                formatted: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
              };
            });
            setAvailableSlots(slotsWithIso);
          } else {
            setAvailableSlots([]);
          }
        } catch (err) {
          console.error("Failed to fetch slots", err);
          setAvailableSlots([]);
        }
        setSelectedTime(null);
      };
      
      fetchSlots();
    }
  }, [selectedDate, event.id, step, totalDuration]);

  const handleServiceToggle = (service: any) => {
    setSelectedServices(prev => 
      prev.some(s => s.id === service.id)
        ? prev.filter(s => s.id !== service.id)
        : [...prev, service]
    );
  };

  const handleBook = async (formData: FormData) => {
    if (!selectedDate || !selectedTime) return;
    
    setIsPending(true);
    setError(null);
    
    formData.append("eventTypeId", event.id);
    formData.append("hostUserId", user.id);
    formData.append("startTimeIso", selectedTime.iso);
    formData.append("duration", totalDuration.toString());
    
    if (selectedServices.length > 0) {
      const currentNotes = formData.get("guestNotes") as string || "";
      const servicesText = "\\nSelected Add-ons: " + selectedServices.map(s => s.name).join(", ");
      formData.set("guestNotes", currentNotes + servicesText);
    }
    
    const result = await createBooking(formData);
    
    if (result.error) {
      setError(result.error);
      setIsPending(false);
    } else if (result.success) {
      setStep("success");
      setIsPending(false);
    }
  };

  const handleAiSlotSelect = (date: Date, timeStr: string) => {
    setSelectedDate(date);
    // Approximate the ISO string for AI fallback (assumes local time)
    const iso = new Date(`${date.toISOString().split("T")[0]}T${timeStr}:00`).toISOString();
    setSelectedTime({ iso, formatted: timeStr });
    setStep("form");
  };

  if (step === "success") {
    return (
      <Card padding="lg" className="max-w-2xl mx-auto mt-12 text-center animate-scale-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success-light)] mb-6">
          <CheckCircle2 className="h-8 w-8 text-[var(--success)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">You are scheduled</h2>
        <p className="text-[var(--foreground-muted)] mb-8">
          A calendar invitation has been sent to your email address.
        </p>
        <div className="p-4 bg-[var(--background-subtle)] border border-[var(--border)] rounded-xl inline-block text-left">
          <p className="font-semibold text-[var(--foreground)] mb-1">{event.title}</p>
          <p className="text-sm flex items-center gap-2 text-[var(--foreground-muted)]">
            <CalendarIcon className="w-4 h-4" />
            {selectedDate?.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-sm flex items-center gap-2 text-[var(--foreground-muted)] mt-1">
            <Clock className="w-4 h-4" />
            {selectedTime?.formatted}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto overflow-hidden shadow-xl shadow-black/5 animate-fade-in flex flex-col md:flex-row">
      {/* Left side: Event details */}
      <div className="p-6 md:p-8 md:w-1/3 bg-[var(--background-subtle)] border-b md:border-b-0 md:border-r border-[var(--border)] relative">
        <p className="text-[var(--foreground-muted)] font-medium mb-2">{user.name}</p>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4 leading-tight">{event.title}</h1>
        
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-[var(--foreground-subtle)] font-medium">
            <Clock className="w-5 h-5 text-[var(--foreground-muted)]" />
            {totalDuration} min {selectedServices.length > 0 && <span className="text-xs text-[var(--primary)] bg-[var(--primary-light)] px-2 py-0.5 rounded-full">Modified</span>}
          </div>
          
          {selectedDate && selectedTime && (step === "form") && (
            <div className="flex items-start gap-3 text-[var(--foreground-subtle)] font-medium text-left">
              <CalendarIcon className="w-5 h-5 text-[var(--foreground-muted)] mt-0.5 shrink-0" />
              <div>
                <p>{selectedTime.formatted}</p>
                <p>{selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-3 text-[var(--foreground-subtle)] font-medium">
            <Globe className="w-5 h-5 text-[var(--foreground-muted)]" />
            {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </div>
        </div>
        
        {event.description && (
          <div className="text-sm text-[var(--foreground-muted)] leading-relaxed prose prose-sm dark:prose-invert">
            <p>{event.description}</p>
          </div>
        )}

        {availableServices.length > 0 && (
          <div className="mt-8 border-t border-[var(--border)] pt-6">
            <h3 className="font-semibold text-[var(--foreground)] mb-3">Add-ons & Services</h3>
            <div className="space-y-3">
              {availableServices.map((service) => {
                const isSelected = selectedServices.some(s => s.id === service.id);
                return (
                  <label key={service.id} className={cn("flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors", isSelected ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-[var(--border)] hover:border-[var(--primary)]/30")}>
                    <input type="checkbox" checked={isSelected} onChange={() => handleServiceToggle(service)} className="mt-1 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                    <div>
                      <div className="text-sm font-medium text-[var(--foreground)]">{service.name}</div>
                      {service.durationMinutes > 0 && <div className="text-xs text-[var(--foreground-muted)]">+{service.durationMinutes} min</div>}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right side: Calendar / AI / Form */}
      <div className="p-6 md:p-8 md:w-2/3 bg-[var(--background)]">
        {(step === "calendar" || step === "ai") && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--foreground)]">Select a Date & Time</h2>
              
              <div className="flex p-1 bg-[var(--background-muted)] rounded-lg">
                <button 
                  onClick={() => setStep("calendar")}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                    step === "calendar" ? "bg-[var(--background)] shadow-sm text-[var(--foreground)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  )}
                >
                  <CalendarIcon className="w-4 h-4 inline-block mr-1.5" />
                  Calendar
                </button>
                <button 
                  onClick={() => setStep("ai")}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                    step === "ai" ? "bg-[var(--background)] shadow-sm text-[var(--primary)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  )}
                >
                  <Sparkles className="w-4 h-4 inline-block mr-1.5" />
                  AI Assist
                </button>
              </div>
            </div>

            {step === "ai" ? (
              <div className="flex-1 animate-fade-in">
                <AIBookingAssistant hostUserId={user.id} eventTypeId={event.id} onSelectSlot={handleAiSlotSelect} />
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-8 animate-fade-in">
                <div className="flex-1">
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['S','M','T','W','T','F','S'].map((day, i) => (
                      <div key={i} className="text-xs font-semibold text-[var(--foreground-muted)] pb-2">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for padding */}
                    {Array.from({ length: days[0].getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square p-1" />
                    ))}
                    
                    {/* Days */}
                    {days.map((date, i) => {
                      const isSelected = selectedDate?.toDateString() === date.toDateString();
                      return (
                        <div key={i} className="aspect-square p-1">
                          <button
                            onClick={() => {
                              setSelectedDate(date);
                              setSelectedTime(null);
                            }}
                            className={cn(
                              "w-full h-full rounded-full flex items-center justify-center text-sm font-medium transition-all",
                              isSelected 
                                ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-md shadow-[var(--primary)]/20" 
                                : "bg-[var(--background-subtle)] text-[var(--primary)] hover:bg-[var(--primary-light)] border border-[var(--primary-light)]"
                            )}
                          >
                            {date.getDate()}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div className="md:w-48 flex flex-col animate-fade-in">
                    <h3 className="font-medium text-[var(--foreground)] mb-4 pb-2 border-b border-[var(--border)] sticky top-0 bg-[var(--background)]">
                      {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 h-[280px]">
                      {availableSlots.length > 0 ? (
                        availableSlots.map((slot, i) => (
                          <div key={i} className="flex gap-2">
                            <button
                              onClick={() => setSelectedTime(slot)}
                              className={cn(
                                "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all border",
                                selectedTime?.iso === slot.iso 
                                  ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)] shadow-lg" 
                                  : "bg-transparent text-[var(--primary)] border-[var(--primary)] hover:bg-[var(--primary-light)]"
                              )}
                            >
                              {slot.formatted}
                            </button>
                            {selectedTime?.iso === slot.iso && (
                              <button
                                onClick={() => setStep("form")}
                                className="bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl px-4 text-sm font-bold shadow-lg animate-scale-in"
                              >
                                Next
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-sm text-[var(--foreground-muted)]">
                          No times available
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === "form" && (
          <div className="animate-fade-in">
            <button 
              onClick={() => setStep("calendar")}
              className="flex items-center text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </button>
            
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">Enter Details</h2>
            
            <form action={handleBook} className="space-y-4">
              <Input
                label="Name"
                name="guestName"
                placeholder="Jane Doe"
                required
              />
              <Input
                label="Email"
                name="guestEmail"
                type="email"
                placeholder="jane@example.com"
                required
              />
              <Textarea
                label="Please share anything that will help prepare for our meeting."
                name="guestNotes"
                placeholder="Any specific topics or questions?"
                rows={4}
              />
              
              {error && (
                <div className="p-3 rounded-lg bg-[var(--destructive-light)] text-[var(--destructive)] text-sm font-medium">
                  {error}
                </div>
              )}
              
              <div className="pt-4">
                <Button type="submit" loading={isPending} fullWidth>
                  Schedule Event
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Card>
  );
}
