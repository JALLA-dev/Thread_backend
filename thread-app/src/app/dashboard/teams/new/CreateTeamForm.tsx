"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createTeam } from "@/lib/actions/teams";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

export function CreateTeamForm() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugPrefix, setSlugPrefix] = useState("");
  const router = useRouter();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setSlugPrefix(slug);
  };

  async function onSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);

    const result = await createTeam(formData);

    if (result.error) {
      setError(result.error);
      setIsPending(false);
    } else if (result.success) {
      router.push("/dashboard/teams");
    }
  }

  return (
    <form action={onSubmit} className="space-y-6">
      <Card padding="lg">
        <div className="space-y-6 max-w-xl">
          <Input
            label="Team Name"
            name="name"
            placeholder="e.g. Acme Sales Team"
            required
            onChange={handleNameChange}
          />

          <Input
            label="Team URL"
            name="slug"
            placeholder="acme-sales"
            defaultValue={slugPrefix}
            required
            leftIcon={<span className="text-xs text-[var(--foreground-muted)]">/team/</span>}
          />

          {error && (
            <div className="p-3 rounded-lg bg-[var(--destructive-light)] text-[var(--destructive)] text-sm font-medium">
              {error}
            </div>
          )}

          <div className="pt-4 border-t border-[var(--border)] flex justify-end gap-3">
            <Link href="/dashboard/teams">
              <Button variant="ghost" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={isPending}>
              Create Team
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}
