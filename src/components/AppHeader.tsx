
import { Logo } from '@/components/Logo';
import { SearchInput } from '@/components/SearchInput';
import { UserNav } from '@/components/UserNav';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AppSidebarNav } from './AppSidebarNav';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
        {/* Left side: Logo and Mobile menu toggle */}
        <div className="flex flex-shrink-0 items-center gap-2 md:gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 pt-8">
               <AppSidebarNav isMobile={true} />
            </SheetContent>
          </Sheet>
          <Logo />
        </div>

        {/* Center: Search Input (takes up remaining space and centers content) */}
        <div className="flex-grow flex justify-center px-2 sm:px-4 md:px-8">
          <div className="hidden md:flex w-full max-w-xl relative"> {/* max-w-xl for wider search */}
            <SearchInput />
          </div>
        </div>

        {/* Right side: User Navigation */}
        <div className="flex flex-shrink-0 items-center">
          <UserNav />
        </div>
      </div>
      {/* Mobile Search (remains below for smaller screens) */}
      <div className="md:hidden p-2 border-t relative">
        <SearchInput />
      </div>
    </header>
  );
}
