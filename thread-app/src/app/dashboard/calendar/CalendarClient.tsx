"use client";

import { useState, useEffect, useMemo } from "react";
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, parseISO, eachDayOfInterval } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

type ViewType = "month" | "week" | "day";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: "thread" | "outlook";
  isAllDay?: boolean;
  status?: string;
}

export function CalendarClient({ isConnected = false }: { isConnected?: boolean }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>("week");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Calculate view boundaries
  const viewStart = useMemo(() => {
    if (view === "month") return startOfWeek(startOfMonth(currentDate));
    if (view === "week") return startOfWeek(currentDate);
    return currentDate; // day
  }, [currentDate, view]);

  const viewEnd = useMemo(() => {
    if (view === "month") return endOfWeek(endOfMonth(currentDate));
    if (view === "week") return endOfWeek(currentDate);
    return addDays(currentDate, 1); // day
  }, [currentDate, view]);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/calendar/events?start=${viewStart.toISOString()}&end=${viewEnd.toISOString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch events");
      
      setEvents(data.events || []);
      if (data.outlookError) {
        // Optional warning display
        console.warn(data.outlookError);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [viewStart, viewEnd]); // Refetch when boundaries change

  const handlePrev = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1));
    if (view === "week") setCurrentDate(subWeeks(currentDate, 1));
    if (view === "day") setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1));
    if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
    if (view === "day") setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const renderMonthView = () => {
    const days = eachDayOfInterval({ start: viewStart, end: viewEnd });
    
    return (
      <div className="grid grid-cols-7 border-l border-t border-[var(--border)] bg-[var(--background-subtle)]">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} className="py-2 text-center text-sm font-semibold text-[var(--foreground-muted)] border-r border-b border-[var(--border)]">
            {d}
          </div>
        ))}
        {days.map((day, idx) => {
          const dayEvents = events.filter(e => isSameDay(parseISO(e.start), day));
          return (
            <div key={day.toISOString()} className={`min-h-[100px] p-2 border-r border-b border-[var(--border)] bg-[var(--background)] ${!isSameMonth(day, currentDate) ? "opacity-40 bg-[var(--background-subtle)]" : ""}`}>
              <div className="text-sm font-medium mb-1 flex justify-between items-center">
                <span className={`w-7 h-7 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? "bg-[var(--primary)] text-white" : ""}`}>
                  {format(day, "d")}
                </span>
              </div>
              <div className="space-y-1">
                {dayEvents.map(e => (
                  <div key={e.id} className={`text-xs p-1 px-2 rounded overflow-hidden text-ellipsis whitespace-nowrap ${e.type === 'thread' ? 'bg-[#0078D4]/10 text-[#0078D4] border border-[#0078D4]/20' : 'bg-[var(--background-muted)] border border-[var(--border)] text-[var(--foreground-muted)]'}`} title={e.title}>
                    {format(parseISO(e.start), "HH:mm")} {e.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const days = eachDayOfInterval({ start: viewStart, end: endOfWeek(currentDate) });
    const hours = Array.from({ length: 24 }).map((_, i) => i);
    const HOUR_HEIGHT = 48; // px

    return (
      <div className="flex flex-col border border-[var(--border)] bg-[var(--background)]">
        {/* Header: Days */}
        <div className="flex border-b border-[var(--border)] ml-16">
          {days.map((day) => (
            <div key={day.toISOString()} className="flex-1 text-center py-2 border-r last:border-r-0 border-[var(--border)]">
              <div className="text-xs font-semibold uppercase text-[var(--foreground-muted)]">{format(day, "EEE")}</div>
              <div className={`text-lg mt-1 w-8 h-8 mx-auto flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? "bg-[var(--primary)] text-white" : ""}`}>{format(day, "d")}</div>
            </div>
          ))}
        </div>

        {/* Grid Body */}
        <div className="flex overflow-y-auto h-[600px] relative">
          {/* Time Gutter */}
          <div className="w-16 flex-shrink-0 bg-[var(--background)]">
            {hours.map((hour) => (
              <div key={hour} className="text-xs text-[var(--foreground-muted)] text-right pr-2 relative" style={{ height: `${HOUR_HEIGHT}px` }}>
                <span className="absolute -top-2 right-2 bg-[var(--background)] px-1">{hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}</span>
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="flex flex-1 relative bg-[var(--background-subtle)]">
            {/* Horizontal Lines for Hours */}
            <div className="absolute inset-0 pointer-events-none flex flex-col">
              {hours.map((hour) => (
                <div key={hour} className="w-full border-t border-[var(--border)]" style={{ height: `${HOUR_HEIGHT}px` }} />
              ))}
            </div>

            {days.map((day) => {
              const dayEvents = events.filter(e => isSameDay(parseISO(e.start), day));
              return (
                <div key={day.toISOString()} className="flex-1 relative border-l border-[var(--border)]">
                  {dayEvents.map(e => {
                    const start = parseISO(e.start);
                    const end = parseISO(e.end);
                    const startMinutes = start.getHours() * 60 + start.getMinutes();
                    const durationMinutes = (end.getTime() - start.getTime()) / 60000;
                    
                    const top = (startMinutes / 60) * HOUR_HEIGHT;
                    const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 20); // Min height 20px

                    return (
                      <div 
                        key={e.id} 
                        className={`absolute inset-x-1 p-1 rounded-md text-xs overflow-hidden leading-tight ${e.type === 'thread' ? 'bg-[#0078D4] text-white border border-[#005a9e]' : 'bg-[var(--primary-light)] border border-[var(--primary)] text-[var(--primary)]'}`}
                        style={{ top: `${top}px`, height: `${height}px`, zIndex: 10 }}
                        title={e.title}
                      >
                        <div className="font-semibold">{format(start, "HH:mm")} - {format(end, "HH:mm")}</div>
                        <div className="truncate">{e.title}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = events.filter(e => isSameDay(parseISO(e.start), currentDate));
    const hours = Array.from({ length: 24 }).map((_, i) => i);
    const HOUR_HEIGHT = 48; // px

    return (
      <div className="flex flex-col border border-[var(--border)] bg-[var(--background)]">
        {/* Header */}
        <div className="flex border-b border-[var(--border)] ml-16">
          <div className="flex-1 text-center py-4 border-r last:border-r-0 border-[var(--border)]">
            <div className="text-sm font-semibold uppercase text-[var(--foreground-muted)]">{format(currentDate, "EEEE")}</div>
            <div className={`text-2xl mt-1 w-12 h-12 mx-auto flex items-center justify-center rounded-full ${isSameDay(currentDate, new Date()) ? "bg-[var(--primary)] text-white" : ""}`}>{format(currentDate, "d")}</div>
          </div>
        </div>

        {/* Grid Body */}
        <div className="flex overflow-y-auto h-[600px] relative">
          {/* Time Gutter */}
          <div className="w-16 flex-shrink-0 bg-[var(--background)]">
            {hours.map((hour) => (
              <div key={hour} className="text-xs text-[var(--foreground-muted)] text-right pr-2 relative" style={{ height: `${HOUR_HEIGHT}px` }}>
                <span className="absolute -top-2 right-2 bg-[var(--background)] px-1">{hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}</span>
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="flex flex-1 relative bg-[var(--background-subtle)]">
            {/* Horizontal Lines for Hours */}
            <div className="absolute inset-0 pointer-events-none flex flex-col">
              {hours.map((hour) => (
                <div key={hour} className="w-full border-t border-[var(--border)]" style={{ height: `${HOUR_HEIGHT}px` }} />
              ))}
            </div>

            <div className="flex-1 relative border-l border-[var(--border)]">
              {dayEvents.map(e => {
                const start = parseISO(e.start);
                const end = parseISO(e.end);
                const startMinutes = start.getHours() * 60 + start.getMinutes();
                const durationMinutes = (end.getTime() - start.getTime()) / 60000;
                
                const top = (startMinutes / 60) * HOUR_HEIGHT;
                const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 20);

                return (
                  <div 
                    key={e.id} 
                    className={`absolute inset-x-2 p-2 rounded-md text-sm overflow-hidden leading-tight ${e.type === 'thread' ? 'bg-[#0078D4] text-white border border-[#005a9e]' : 'bg-[var(--primary-light)] border border-[var(--primary)] text-[var(--primary)]'}`}
                    style={{ top: `${top}px`, height: `${height}px`, zIndex: 10 }}
                    title={e.title}
                  >
                    <div className="font-semibold">{format(start, "HH:mm")} - {format(end, "HH:mm")}</div>
                    <div className="truncate font-medium">{e.title}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleToday}>Today</Button>
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={handlePrev} className="px-2">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleNext} className="px-2">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            {view === "month" ? format(currentDate, "MMMM yyyy") : 
             view === "week" ? `${format(startOfWeek(currentDate), "MMM d")} - ${format(endOfWeek(currentDate), "MMM d, yyyy")}` :
             format(currentDate, "MMMM d, yyyy")}
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
          {isConnected ? (
            <Badge variant="success" className="hidden md:flex gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="default" className="hidden md:flex gap-1 text-[var(--foreground-muted)]">
              <AlertCircle className="h-3 w-3" />
              Not Connected
            </Badge>
          )}
          
          <Link href="/dashboard/event-types">
            <Button size="sm" className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white gap-2">
              <Plus className="h-4 w-4" />
              Schedule
            </Button>
          </Link>
          
          <div className="text-sm text-[var(--foreground-muted)] hidden lg:block border-l border-[var(--border)] pl-3 ml-1">
            {timezone}
          </div>
          <Button variant="outline" size="sm" onClick={fetchEvents} loading={loading} className="px-2">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <div className="bg-[var(--background-muted)] p-1 rounded-lg flex items-center border border-[var(--border)]">
            <button onClick={() => setView("month")} className={`px-3 py-1.5 text-sm font-medium rounded-md ${view === "month" ? "bg-[var(--background)] shadow-sm text-[var(--foreground)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"}`}>Month</button>
            <button onClick={() => setView("week")} className={`px-3 py-1.5 text-sm font-medium rounded-md ${view === "week" ? "bg-[var(--background)] shadow-sm text-[var(--foreground)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"}`}>Week</button>
            <button onClick={() => setView("day")} className={`px-3 py-1.5 text-sm font-medium rounded-md ${view === "day" ? "bg-[var(--background)] shadow-sm text-[var(--foreground)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"}`}>Day</button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[var(--destructive-light)] text-[var(--destructive)] rounded-lg font-medium text-sm">
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        {view === "month" && renderMonthView()}
        {view === "week" && renderWeekView()}
        {view === "day" && renderDayView()}
      </Card>
    </div>
  );
}
