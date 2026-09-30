"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { addTeamMember, removeTeamMember } from "@/lib/actions/teams";
import { UserPlus, UserMinus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface Member {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  role: string;
  joinedAt: Date;
}

interface TeamMembersClientProps {
  teamId: string;
  members: Member[];
  isOwnerOrAdmin: boolean;
}

export function TeamMembersClient({ teamId, members, isOwnerOrAdmin }: TeamMembersClientProps) {
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsPending(true);
    setError(null);

    const result = await addTeamMember(teamId, email);

    if (result.error) {
      setError(result.error);
    } else {
      setEmail("");
    }
    
    setIsPending(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    
    setIsPending(true);
    setError(null);

    const result = await removeTeamMember(teamId, memberId);

    if (result.error) {
      alert(result.error);
    }
    
    setIsPending(false);
  };

  return (
    <div className="space-y-6">
      {isOwnerOrAdmin && (
        <form onSubmit={handleAddMember} className="flex gap-3 items-start">
          <div className="flex-1">
            <Input
              name="email"
              type="email"
              placeholder="Invite user by email (must have a Thread account)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <p className="text-xs text-[var(--destructive)] mt-1.5">{error}</p>}
          </div>
          <Button type="submit" loading={isPending} leftIcon={<UserPlus className="h-4 w-4" />}>
            Add Member
          </Button>
        </form>
      )}

      <div className="border border-[var(--border)] rounded-xl overflow-hidden divide-y divide-[var(--border)]">
        {members.map((member) => (
          <div key={member.id} className="p-4 flex items-center justify-between bg-[var(--background-subtle)] hover:bg-[var(--background-muted)] transition-colors">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[var(--foreground)]">{member.name || "Unknown User"}</p>
                <Badge variant={member.role === "owner" ? "primary" : "default"} className="text-xs py-0 px-2 h-5">
                  {member.role}
                </Badge>
              </div>
              <p className="text-sm text-[var(--foreground-muted)]">{member.email}</p>
            </div>
            
            {isOwnerOrAdmin && member.role !== "owner" && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[var(--destructive)] hover:text-[var(--destructive)] hover:bg-[var(--destructive-light)]"
                onClick={() => handleRemoveMember(member.id)}
                disabled={isPending}
              >
                <UserMinus className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
