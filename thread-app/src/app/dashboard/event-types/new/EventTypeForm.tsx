"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { createEventType } from "@/lib/actions/event-types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

export function EventTypeForm({ username, teams }: { username: string | undefined, teams?: any[] }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugPrefix, setSlugPrefix] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const router = useRouter();

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-generate slug from title
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setSlugPrefix(slug);
  };

  async function onSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);

    const result = await createEventType(formData);

    if (result.error) {
      setError(result.error);
      setIsPending(false);
    } else if (result.success) {
      router.push("/dashboard/event-types");
    }
  }

  return (
    <form action={onSubmit} className="space-y-6">
      <Card padding="lg">
        <div className="space-y-6 max-w-xl">
          <Input
            label="Event Name"
            name="title"
            placeholder="e.g. 30 Minute Meeting"
            required
            onChange={handleTitleChange}
          />

          <Input
            label="URL Slug"
            name="slug"
            placeholder="30-min-meeting"
            defaultValue={slugPrefix}
            required
            leftIcon={<span className="text-xs text-[var(--foreground-muted)]">{username ? `/${username}/` : "/book/"}</span>}
          />

          <Textarea
            label="Description"
            name="description"
            placeholder="Write a summary and any details your invitee should know about the meeting."
            rows={4}
          />

          {teams && teams.length > 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Assign to Team (Optional)
                </label>
                <select 
                  name="teamId" 
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-shadow"
                >
                  <option value="">Personal (No Team)</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              {selectedTeam && (
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Routing Strategy
                  </label>
                  <select 
                    name="routingStrategy" 
                    className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-shadow"
                  >
                    <option value="round_robin">Round Robin (Distribute evenly)</option>
                    <option value="collective">Collective (All must be available) - Coming Soon</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration"
              name="duration"
              type="number"
              defaultValue="30"
              required
              rightIcon={<span className="text-xs text-[var(--foreground-muted)]">mins</span>}
            />
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--background-subtle)]">
            <input
              type="checkbox"
              id="requiresApproval"
              name="requiresApproval"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 bg-white"
            />
            <div>
              <label htmlFor="requiresApproval" className="font-medium text-sm text-[var(--foreground)]">
                Requires Approval
              </label>
              <p className="text-xs text-[var(--foreground-muted)]">
                You must approve requests before they are confirmed on your calendar.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[var(--destructive-light)] text-[var(--destructive)] text-sm font-medium">
              {error}
            </div>
          )}

          <div className="pt-4 border-t border-[var(--border)] flex justify-end gap-3">
            <Link href="/dashboard/event-types">
              <Button variant="ghost" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={isPending}>
              Create Event Type
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}
