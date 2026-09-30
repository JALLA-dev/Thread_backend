import { db } from "@/db";
import { users, eventTypes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(props: { params: Promise<{ username: string }> }) {
  const params = await props.params;
  const username = decodeURIComponent(params.username);
  const userList = await db.select({ name: users.firstName, username: users.username }).from(users).where(eq(users.username, username)).limit(1);
  if (userList.length === 0) return { title: "Not Found" };
  
  return {
    title: `${userList[0].name || userList[0].username}'s Booking Page`,
  };
}

export default async function PublicProfilePage(props: { params: Promise<{ username: string }> }) {
  const resolvedParams = await props.params;
  const username = decodeURIComponent(resolvedParams.username);
  
  const userList = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      username: users.username,
      imageUrl: users.imageUrl,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (userList.length === 0) {
    notFound();
  }

  const host = userList[0];
  const displayName = host.firstName ? `${host.firstName} ${host.lastName || ""}`.trim() : (host.username || "Host");

  // Fetch all active public event types for this user
  const events = await db
    .select()
    .from(eventTypes)
    .where(
      and(
        eq(eventTypes.userId, host.id),
        eq(eventTypes.isActive, true)
      )
    );

  return (
    <div className={`min-h-screen bg-[var(--background)] flex flex-col font-sans ${geistSans.variable} ${geistMono.variable}`}>
      <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
        <div className="flex flex-col items-center text-center mb-12">
          {host.imageUrl ? (
            <img src={host.imageUrl} alt={displayName} className="w-24 h-24 rounded-full mb-4 border border-[var(--border)]" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-3xl font-bold mb-4">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-3xl font-bold text-[var(--foreground)]">{displayName}</h1>
          <p className="text-[var(--foreground-muted)] mt-2">Welcome to my scheduling page. Please select an event to book time with me.</p>
        </div>

        {events.length === 0 ? (
          <div className="text-center p-8 bg-[var(--background-subtle)] rounded-lg border border-[var(--border)]">
            <p className="text-[var(--foreground-muted)]">This user currently has no public event types available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => (
              <Link key={event.id} href={`/${host.username}/${event.slug}`}>
                <Card className="p-6 hover:border-[var(--primary)] transition-colors h-full flex flex-col cursor-pointer hover:shadow-md bg-[var(--card)]">
                  <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">{event.title}</h2>
                  {event.description && (
                    <p className="text-sm text-[var(--foreground-muted)] mb-4 line-clamp-2 flex-1">{event.description}</p>
                  )}
                  <div className="flex items-center text-sm font-medium text-[var(--foreground-subtle)] mt-auto pt-4 border-t border-[var(--border)]">
                    <Clock className="w-4 h-4 mr-2" />
                    {event.durationMinutes} mins
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      
      <footer className="py-6 text-center text-sm text-[var(--foreground-subtle)] border-t border-[var(--border)] mt-12">
        Powered by Thread
      </footer>
    </div>
  );
}
