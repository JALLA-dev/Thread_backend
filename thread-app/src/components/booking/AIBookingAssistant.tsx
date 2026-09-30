"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Bot, Send, Calendar as CalendarIcon, Clock } from "lucide-react";
import { suggestBookingTimes } from "@/lib/actions/ai";

interface AIBookingAssistantProps {
  hostUserId: string;
  eventTypeId: string;
  onSelectSlot: (date: Date, time: string) => void;
}

export function AIBookingAssistant({ hostUserId, eventTypeId, onSelectSlot }: AIBookingAssistantProps) {
  const [prompt, setPrompt] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string; suggestions?: any[] }[]>([
    { role: "ai", content: "Hi! I'm the AI scheduling assistant. When would you like to meet?" }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userMessage = prompt;
    setPrompt("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsPending(true);

    try {
      const response = await suggestBookingTimes(userMessage, hostUserId, eventTypeId);
      
      if (response.error) {
        setMessages(prev => [...prev, { role: "ai", content: "Sorry, I ran into an error checking the calendar." }]);
      } else {
        setMessages(prev => [
          ...prev, 
          { 
            role: "ai", 
            content: response.aiResponse || "Here are some options:", 
            suggestions: response.suggestions 
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", content: "An unexpected error occurred." }]);
    }
    
    setIsPending(false);
  };

  return (
    <div className="flex flex-col h-[400px] border border-[var(--border)] rounded-xl bg-[var(--background-subtle)] overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-[var(--border)] bg-[var(--background)]">
        <Bot className="w-5 h-5 text-[var(--primary)]" />
        <span className="font-medium text-sm text-[var(--foreground)]">AI Scheduling Assistant</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div 
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                msg.role === "user" 
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] rounded-br-none" 
                  : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] rounded-bl-none"
              }`}
            >
              {msg.content}
            </div>
            
            {msg.suggestions && msg.suggestions.length > 0 && (
              <div className="mt-3 space-y-3 w-full max-w-[90%]">
                {msg.suggestions.map((sug: any, j: number) => (
                  <div key={j} className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-3">
                    <p className="text-xs font-medium text-[var(--foreground)] mb-2 flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                      {new Date(sug.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    {sug.reasoning && (
                      <p className="text-xs text-[var(--foreground-muted)] mb-3 italic">"{sug.reasoning}"</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {sug.slots.length > 0 ? sug.slots.map((time: string) => (
                        <button
                          key={time}
                          onClick={() => onSelectSlot(new Date(sug.date), time)}
                          className="text-xs px-2.5 py-1.5 rounded-md border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] transition-colors flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3" />
                          {time}
                        </button>
                      )) : (
                        <span className="text-xs text-[var(--foreground-muted)]">No available slots</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {isPending && (
          <div className="flex items-start">
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-2xl rounded-bl-none px-4 py-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--foreground-muted)] animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--foreground-muted)] animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--foreground-muted)] animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-3 bg-[var(--background)] border-t border-[var(--border)] flex gap-2">
        <Input
          name="prompt"
          placeholder="E.g., Next Tuesday morning"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isPending}
          className="flex-1"
        />
        <Button type="submit" disabled={isPending || !prompt.trim()} className="px-3" variant="primary">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
