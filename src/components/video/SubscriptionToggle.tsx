
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import type { Channel } from '@/types';
import { formatNumber } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface SubscriptionToggleProps {
  channel: Channel;
  initialSubscribed?: boolean; 
}

export function SubscriptionToggle({ channel, initialSubscribed = false }: SubscriptionToggleProps) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed);
  // In a real app, initialSubscribed would come from user data/Firestore

  const handleToggleSubscription = async () => {
    if (authLoading) return; // Don't do anything if auth state is still loading

    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to subscribe to channels.',
        variant: 'destructive',
        action: (
            <Button onClick={() => router.push('/login')} variant="outline" size="sm">
                Login
            </Button>
        )
      });
      return;
    }

    // Optimistic update
    setIsSubscribed(!isSubscribed);
    
    // TODO: Implement actual API call to Firebase/backend to update subscription status
    // Example:
    // try {
    //   if (isSubscribed) {
    //     await unsubscribeFromChannel(user.uid, channel.id);
    //   } else {
    //     await subscribeToChannel(user.uid, channel.id);
    //   }
    // } catch (error) {
    //   console.error("Failed to update subscription:", error);
    //   setIsSubscribed(isSubscribed); // Revert optimistic update on error
    //   toast({ title: 'Error', description: 'Could not update subscription.', variant: 'destructive' });
    // }
    console.log(isSubscribed ? `Unsubscribed from ${channel.name}` : `Subscribed to ${channel.name}`);
  };
  
  const currentSubscriberCount = channel.subscribers; // This should come from API for channel details

  return (
    <Button 
      onClick={handleToggleSubscription}
      variant={isSubscribed ? 'secondary' : 'default'} 
      className="min-w-[130px] sm:min-w-[150px] text-xs sm:text-sm"
      disabled={authLoading} // Disable button while auth is loading
    >
      {isSubscribed ? <BellOff className="mr-1.5 h-4 w-4" /> : <Bell className="mr-1.5 h-4 w-4" />}
      {isSubscribed ? 'Subscribed' : 'Subscribe'} 
      {/* Displaying subscriber count from channel prop, not client-side manipulated */}
      {currentSubscriberCount > 0 && (
        <span className="ml-1.5 text-xs opacity-80 hidden sm:inline">({formatNumber(currentSubscriberCount)})</span>
      )}
    </Button>
  );
}
