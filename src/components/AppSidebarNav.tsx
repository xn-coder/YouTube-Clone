'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Flame, Youtube, UserSquare2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/trending', label: 'Trending', icon: Flame },
  { href: '/subscriptions', label: 'Subscriptions', icon: Youtube },
  // { href: '/library', label: 'Library', icon: Library },
  // { href: '/history', label: 'History', icon: History },
];

interface AppSidebarNavProps {
  isMobile?: boolean;
  className?: string;
}

export function AppSidebarNav({ isMobile = false, className }: AppSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-1 px-2 py-4", className)}>
      {navItems.map((item) => (
        <Button
          key={item.label}
          variant={pathname === item.href ? 'secondary' : 'ghost'}
          className="justify-start"
          asChild
        >
          <Link href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-foreground transition-all hover:text-primary">
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
