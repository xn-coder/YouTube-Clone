import { AppHeader } from '@/components/AppHeader';
import { AppSidebar } from '@/components/AppSidebar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="flex flex-1">
        <AppSidebar />
        <main className="flex-1 md:pl-60 pt-2"> {/* Adjust pt-4 based on header height */}
          {children}
        </main>
      </div>
    </div>
  );
}
