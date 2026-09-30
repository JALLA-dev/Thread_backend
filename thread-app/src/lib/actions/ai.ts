"use server";

import { getAvailableSlots } from "./booking";

/**
 * Mock AI Integration for Thread Scheduling.
 * In a full production scenario, this would use the Vercel AI SDK or OpenAI directly
 * to interpret a user's natural language request and match it against their calendar.
 */
export async function suggestBookingTimes(
  prompt: string,
  hostUserId: string,
  eventTypeId: string
) {
  try {
    // 1. Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // 2. We mock "understanding" the prompt by just grabbing today and tomorrow's slots
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = today.toISOString().split("T")[0];
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const host = process.env.VERCEL_URL || "localhost:3000"; // Fallback for local dev
    const baseUrl = `${protocol}://${host}`;

    // Fetch slots from our own API route
    const fetchSlots = async (dateStr: string) => {
      try {
        const res = await fetch(`${baseUrl}/api/booking-slots?eventTypeId=${eventTypeId}&date=${dateStr}&timeZone=UTC`, {
          cache: "no-store"
        });
        const data = await res.json();
        if (!res.ok || !data.slots) return [];
        return data.slots.map((s: any) => {
          const d = new Date(s.start);
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        });
      } catch (e) {
        return [];
      }
    };

    const todaySlots = await fetchSlots(todayStr);
    const tomorrowSlots = await fetchSlots(tomorrowStr);

    return {
      success: true,
      suggestions: [
        {
          date: todayStr,
          slots: todaySlots.slice(0, 2), // Pick first 2
          reasoning: "Based on your request, I found some immediate openings this afternoon.",
        },
        {
          date: tomorrowStr,
          slots: tomorrowSlots.slice(0, 3), // Pick first 3
          reasoning: "If you prefer tomorrow, here are the optimal times that don't conflict with any focus blocks.",
        }
      ].filter(s => s.slots.length > 0),
      aiResponse: "I've checked the calendar and found a few optimal times that might work for you."
    };
  } catch (error) {
    console.error("AI Error:", error);
    return { error: "Failed to generate AI suggestions" };
  }
}
