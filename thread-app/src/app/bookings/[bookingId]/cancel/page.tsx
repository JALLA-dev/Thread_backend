import { getBookingDetails } from "@/lib/actions/manage-booking";
import { notFound } from "next/navigation";
import { CancelBookingForm } from "@/components/booking/CancelBookingForm";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

interface CancelPageProps {
  params: Promise<{
    bookingId: string;
  }>;
}

export const metadata = {
  title: "Cancel Booking",
};

export default async function CancelBookingPage(props: CancelPageProps) {
  const params = await props.params;
  const booking = await getBookingDetails(params.bookingId);

  if (!booking) {
    notFound();
  }

  return (
    <div className={`min-h-screen bg-[var(--background)] flex flex-col font-sans ${geistSans.variable} ${geistMono.variable}`}>
      <main className="flex-1 container mx-auto px-4 py-12">
        <CancelBookingForm booking={booking} />
      </main>
      
      <footer className="py-6 text-center text-sm text-[var(--foreground-subtle)]">
        Powered by Thread
      </footer>
    </div>
  );
}
