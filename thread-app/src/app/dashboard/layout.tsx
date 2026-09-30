import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background-subtle)]">
      {/* Desktop Sidebar — hidden on mobile */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile Header — shown only on mobile/tablet */}
        <MobileHeader />

        {/* Page Content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto"
          role="main"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
