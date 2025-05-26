import { ScrollArea } from '@/components/ui/scroll-area';
import { AppSidebarNav } from './AppSidebarNav';

export function AppSidebar() {
  return (
    <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-10 md:block md:w-60 md:overflow-y-auto md:border-r md:bg-background md:pb-4 md:pt-16">
      <ScrollArea className="h-full py-4">
        <AppSidebarNav />
      </ScrollArea>
    </aside>
  );
}
