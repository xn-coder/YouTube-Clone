import { Logo } from '@/components/Logo';
import { SearchInput } from '@/components/SearchInput';
import { UserNav } from '@/components/UserNav';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AppSidebarNav } from './AppSidebarNav'; // Assume AppSidebarNav provides nav items

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
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
        <div className="hidden flex-1 justify-center px-8 md:flex">
          <SearchInput />
        </div>
        <UserNav />
      </div>
      <div className="md:hidden p-2 border-t">
        <SearchInput />
      </div>
    </header>
  );
}
