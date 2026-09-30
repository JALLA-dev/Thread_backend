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
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleJoin = async () => {
    setErrorMessage(null);

    // 1. If we already have the Teams link, open it directly
    if (conferenceLink) {
      window.open(conferenceLink, "_blank", "noreferrer");
      return;
    }

    // 2. If no link exists yet, request creation via Microsoft Graph
    setIsLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/create-meeting`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data.conferenceLink) {
        setErrorMessage(data.error || "Meeting link is not available.");
      } else {
        setConferenceLink(data.conferenceLink);
        window.open(data.conferenceLink, "_blank", "noreferrer");
      }
    } catch {
      setErrorMessage("Meeting link is not available.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1 items-start">
      <Button
        variant="secondary"
        size="sm"
        leftIcon={<Video className="h-4 w-4" />}
        loading={isLoading}
        onClick={handleJoin}
        title="Join Microsoft Teams meeting"
      >
        Join
      </Button>
      {errorMessage && (
        <span className="text-xs text-[var(--destructive)] max-w-[160px] leading-tight">
          {errorMessage}
        </span>
      )}
    </div>
  );
}

