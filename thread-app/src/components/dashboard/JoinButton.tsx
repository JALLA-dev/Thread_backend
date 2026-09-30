"use client";

import { useState } from "react";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface JoinButtonProps {
  bookingId: string;
  initialConferenceLink: string | null;
}

export function JoinButton({ bookingId, initialConferenceLink }: JoinButtonProps) {
  const [conferenceLink, setConferenceLink] = useState<string | null>(initialConferenceLink);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If we already have a link, show the Join button directly
  if (conferenceLink) {
    return (
      <a href={conferenceLink} target="_blank" rel="noreferrer">
        <Button variant="secondary" size="sm" leftIcon={<Video className="h-4 w-4" />}>
          Join
        </Button>
      </a>
    );
  }

  // No link yet — offer to create one
  const handleCreateMeeting = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/create-meeting`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.conferenceLink) {
        setError(data.error ?? "Could not create meeting link.");
      } else {
        setConferenceLink(data.conferenceLink);
        // Immediately open the meeting link
        window.open(data.conferenceLink, "_blank", "noreferrer");
      }
    } catch {
      setError("Could not create meeting link.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="secondary"
        size="sm"
        leftIcon={<Video className="h-4 w-4" />}
        loading={isCreating}
        onClick={handleCreateMeeting}
        title="Create Teams meeting link"
      >
        Create Link
      </Button>
      {error && (
        <span className="text-xs text-[var(--destructive)] max-w-[140px] leading-tight">
          {error}
        </span>
      )}
    </div>
  );
}
