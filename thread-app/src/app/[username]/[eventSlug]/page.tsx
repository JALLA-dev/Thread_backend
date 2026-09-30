import { getPublicEventDetails } from "@/lib/actions/booking";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/booking/BookingForm";


interface BookingPageProps {
  params: Promise<{
    username: string;
    eventSlug: string;
  }>;
}

export async function generateMetadata(props: BookingPageProps) {
  const params = await props.params;
  const data = await getPublicEventDetails(params.username, params.eventSlug);
  
  if (!data) return { title: "Not Found" };
  
  return {
    title: `${data.event.title} with ${data.user.name || data.user.username}`,
    description: data.event.description || "Schedule a meeting.",
  };
}

// Note: This is an isolated public page, so it wraps itself in a clean layout
// It shares the ThemeProvider so it matches the app's aesthetic.
export default async function BookingPage(props: BookingPageProps) {
  const params = await props.params;
  const data = await getPublicEventDetails(params.username, params.eventSlug);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col font-sans">
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="flex justify-center mb-8">
          {/* Simple branding or logo could go here */}
          <div className="font-bold text-2xl tracking-tighter flex items-center gap-2 text-[var(--foreground)]">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-lg">
              T
            </div>
            Thread
          </div>
        </div>
        
        <BookingForm user={data.user} event={data.event} />
      </main>
      
      <footer className="py-6 text-center text-sm text-[var(--foreground-subtle)]">
        Powered by Thread
      </footer>
    </div>
  );
}
