"use client";

import { useState } from "react";
import { Copy, Edit2, Link as LinkIcon, MoreVertical, Trash2, Globe, Lock } from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toggleEventTypeStatus, deleteEventType } from "@/lib/actions/event-types";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EventTypeCardProps {
  event: {
    id: string;
    title: string;
    slug: string;
    durationMinutes: number;
    description: string | null;
    isActive: boolean;
  };
  username: string | undefined;
}

export function EventTypeCard({ event, username }: EventTypeCardProps) {
  const [isPending, setIsPending] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const bookingUrl = username 
    ? `${window.location.origin}/${username}/${event.slug}`
    : `${window.location.origin}/book/${event.slug}`; // Fallback if no username

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  };

  const handleToggleStatus = async () => {
    setIsPending(true);
    await toggleEventTypeStatus(event.id, !event.isActive);
    setIsPending(false);
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
      setIsPending(true);
      await deleteEventType(event.id);
      setIsPending(false);
    }
  };

  return (
    <Card padding="md" className={cn("relative group", !event.isActive && "opacity-70")}>
      {/* Dropdown Menu Overlay */}
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)} 
          />
          <div className="absolute top-12 right-4 z-20 w-48 rounded-md shadow-lg bg-[var(--card)] border border-[var(--border)] overflow-hidden animate-fade-in">
            <Link 
              href={`/dashboard/event-types/${event.id}/edit`}
              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--background-muted)] w-full text-left"
            >
              <Edit2 className="h-4 w-4" /> Edit
            </Link>
            <button
              onClick={handleToggleStatus}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--background-muted)] w-full text-left disabled:opacity-50"
            >
              {event.isActive ? (
                <>Turn off</>
              ) : (
                <>Turn on</>
              )}
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--destructive)] hover:bg-[var(--destructive-light)] w-full text-left disabled:opacity-50 border-t border-[var(--border)]"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <Badge variant={event.isActive ? "success" : "default"}>
            {event.isActive ? "Active" : "Inactive"}
          </Badge>
          <Badge variant="outline"><Globe className="h-3 w-3 mr-1" /> Public</Badge>
        </div>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 rounded-md text-[var(--foreground-muted)] hover:bg-[var(--background-muted)] hover:text-[var(--foreground)]"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      <CardTitle className="mb-1 text-xl">{event.title}</CardTitle>
      <CardDescription className="mb-6 flex items-center gap-2">
        <span>{event.durationMinutes} mins</span>
        <span>•</span>
        <span className="text-[var(--primary)]">/{event.slug}</span>
      </CardDescription>

      <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 mt-2">
        <Button 
          variant="secondary" 
          size="sm" 
          leftIcon={<Copy className="h-4 w-4" />}
          onClick={handleCopyLink}
        >
          {isCopied ? "Copied!" : "Copy Link"}
        </Button>
        <Link href={`/dashboard/event-types/${event.id}/edit`}>
          <Button variant="ghost" size="sm">
            Settings
          </Button>
        </Link>
      </div>
    </Card>
  );
}
