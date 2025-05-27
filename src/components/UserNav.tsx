
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogIn, LogOut, UserCircle, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase'; 
import { signOut } from 'firebase/auth'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

// Helper function to get a consistent avatar background color class based on user ID
const getAvatarColorClass = (userId: string): string => {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-teal-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-rose-500',
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash % colors.length);
  return colors[index];
};


export function UserNav() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth); 
      toast({ title: 'Logged out', description: 'You have been successfully logged out.' });
      router.push('/'); 
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({ title: 'Logout Failed', description: error.message || 'Sign out failed.', variant: 'destructive' });
    }
  };

  if (loading) {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/login">
            <LogIn className="mr-2 h-4 w-4" />
            Login
          </Link>
        </Button>
        <Button variant="default" size="sm" asChild>
          <Link href="/signup">
            <UserPlus className="mr-2 h-4 w-4" />
            Sign Up
          </Link>
        </Button>
      </div>
    );
  }

  const getInitials = (email?: string | null): string | JSX.Element => {
    if (email && typeof email === 'string' && email.length > 0) {
      return email.charAt(0).toUpperCase();
    }
    return <UserCircle className="h-8 w-8 text-muted-foreground" />; // Ensure UserCircle has a color if no dynamic bg
  };

  const userInitialsOrIcon = getInitials(user.email);
  const avatarColorClass = typeof userInitialsOrIcon === 'string' ? getAvatarColorClass(user.uid) : '';


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={user.photoURL || undefined} 
              alt={user.displayName || user.email || "User avatar"} 
              data-ai-hint="user avatar" 
            />
            <AvatarFallback 
              className={cn(
                "text-lg font-semibold",
                avatarColorClass && `text-primary-foreground ${avatarColorClass}` // Apply color if initials are a string
              )}
            >
              {user.photoURL ? null : userInitialsOrIcon}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName || (user.email ? user.email.split('@')[0] : 'User')}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Removed Profile and Settings options */}
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
