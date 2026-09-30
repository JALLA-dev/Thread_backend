"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { disconnectCalendar, checkMicrosoftCredentials } from "@/lib/actions/integrations";
import { Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface OutlookConnectionProps {
  connection: {
    id: string;
    email: string | null;
  } | undefined;
}

export function OutlookConnection({ connection }: OutlookConnectionProps) {
  const [isPending, setIsPending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Credential State
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [tenantId, setTenantId] = useState("common");
  const [redirectUri, setRedirectUri] = useState("");
  
  const [verificationResult, setVerificationResult] = useState<"none" | "success" | "error">("none");
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== 'undefined' && !redirectUri) {
      setRedirectUri(`${window.location.origin}/api/calendar/outlook/callback`);
    }
  }, [redirectUri]);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(errorParam.replace(/_/g, " "));
    }
    const successParam = searchParams.get("success");
    if (successParam === "outlook_connected") {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  // Reset verification state when any credential changes
  useEffect(() => {
    if (verificationResult !== "none") {
      setVerificationResult("none");
      setVerificationError(null);
    }
  }, [clientId, clientSecret, tenantId, redirectUri]);

  const handleDisconnect = async () => {
    if (!connection) return;
    setIsPending(true);
    setError(null);
    const result = await disconnectCalendar(connection.id);
    if (result.error) setError(result.error);
    setIsPending(false);
  };

  const handleCheckCredentials = async () => {
    if (!clientId || !clientSecret || !tenantId || !redirectUri) {
      setVerificationResult("error");
      setVerificationError("All fields are required.");
      return;
    }
    
    setIsChecking(true);
    setVerificationResult("none");
    setVerificationError(null);
    
    const result = await checkMicrosoftCredentials(clientId, clientSecret, tenantId, redirectUri);
    
    if (result.error) {
      setVerificationResult("error");
      setVerificationError(result.error);
    } else {
      setVerificationResult("success");
    }
    
    setIsChecking(false);
  };

  return (
    <Card className="mb-8">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0078D4]/10 rounded-xl">
              <Calendar className="h-6 w-6 text-[#0078D4]" />
            </div>
            <div>
              <CardTitle className="text-lg">Microsoft Outlook Calendar</CardTitle>
              <CardDescription className="mt-0.5 max-w-xl">
                Connect Outlook to check calendar conflicts and create meetings automatically.
              </CardDescription>
            </div>
          </div>
          {connection && (
            <Badge variant="success" className="gap-1 px-2.5 py-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <div className="px-6 pb-6 pt-2">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--destructive-light)] text-[var(--destructive)] text-sm font-medium">
            {error}
          </div>
        )}

        {connection ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--background-subtle)] gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                My Outlook Calendar
              </p>
              <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
                Connected as {connection.email || "Unknown email"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()} 
                disabled={isPending}
              >
                Refresh
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDisconnect} 
                loading={isPending}
              >
                Disconnect
              </Button>
            </div>
          </div>
        ) : isConfiguring ? (
          <form method="POST" action="/api/calendar/outlook/connect" className="p-5 border border-[var(--border)] rounded-xl bg-[var(--background-subtle)] space-y-5 animate-fade-in">
            <div className="pb-2 border-b border-[var(--border)]">
              <h3 className="font-semibold text-[var(--foreground)]">Connect Outlook</h3>
              <p className="text-sm text-[var(--foreground-muted)] mt-1">Step 1 of 3</p>
            </div>
            
            <div className="space-y-4">
              <Input
                label="Microsoft Client ID"
                name="clientId"
                placeholder="Enter your Microsoft Application Client ID"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              />
              <Input
                label="Microsoft Client Secret"
                name="clientSecret"
                type="password"
                placeholder="Enter your Microsoft Application Client Secret"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                required
              />
              <Input
                label="Tenant ID"
                name="tenantId"
                placeholder="e.g. common, organizations, or a specific tenant ID"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                required
              />
              <Input
                label="Redirect URI"
                name="redirectUri"
                placeholder="http://localhost:3000/api/calendar/outlook/callback"
                value={redirectUri}
                onChange={(e) => setRedirectUri(e.target.value)}
                required
              />
            </div>
            
            {verificationResult === "success" && (
              <div className="p-4 rounded-lg bg-[var(--success-light)] text-[var(--success)] text-sm flex gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold mb-1">Credentials verified successfully.</p>
                  <p>Your Microsoft configuration is valid. You can now connect your Outlook Calendar.</p>
                </div>
              </div>
            )}

            {verificationResult === "error" && (
              <div className="p-4 rounded-lg bg-[var(--destructive-light)] text-[var(--destructive)] text-sm flex items-center gap-2 font-medium">
                <AlertCircle className="h-5 w-5 shrink-0" />
                {verificationError || "Credentials could not be verified."}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row justify-between gap-4">
              <Button type="button" variant="ghost" onClick={() => setIsConfiguring(false)}>
                Cancel
              </Button>
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCheckCredentials}
                  loading={isChecking}
                >
                  {isChecking ? "Checking credentials..." : "Check Credentials"}
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={verificationResult !== "success"}
                >
                  Connect Outlook
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <Button 
            onClick={() => setIsConfiguring(true)} 
            className="bg-[#0078D4] hover:bg-[#006CBE] text-white"
          >
            Connect Outlook
          </Button>
        )}
      </div>
    </Card>
  );
}
