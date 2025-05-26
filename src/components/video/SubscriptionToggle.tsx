'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import type { Channel } from '@/types';
import { formatNumber } from '@/lib/utils';

interface SubscriptionToggleProps {
  channel: Channel;
  initialSubscribed?: boolean; // This would ideally come from user data
}

export function SubscriptionToggle({ channel, initialSubscribed = false }: SubscriptionToggleProps) {
  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed);
  // Subscriber count from channel prop should be up-to-date from API
  // No need to manage subscriberCount state here unless we want optimistic updates
  // that differ from API, which adds complexity.

  const handleToggleSubscription = () => {
    setIsSubscribed(!isSubscribed);
    // Here you would typically make an API call to update subscription status
    // For now, it's a client-side toggle.
    console.log(isSubscribed ? `Unsubscribed from ${channel.name}` : `Subscribed to ${channel.name}`);
    // If you wanted optimistic updates for subscriber count:
    // setSubscriberCount(prev => isSubscribed ? prev -1 : prev + 1); 
  };
  
  // Ensure the button reflects the latest subscriber count from the prop
  const currentSubscriberCount = channel.subscribers;

  return (
    <Button 
      onClick={handleToggleSubscription}
      variant={isSubscribed ? 'secondary' : 'default'} // YouTube uses dark grey for subscribed, white/light grey for subscribe
      className="min-w-[130px] sm:min-w-[150px] text-xs sm:text-sm"
    >
      {isSubscribed ? <BellOff className="mr-1.5 h-4 w-4" /> : <Bell className="mr-1.5 h-4 w-4" />}
      {isSubscribed ? 'Subscribed' : 'Subscribe'} 
      {currentSubscriberCount > 0 && (
        <span className="ml-1.5 text-xs opacity-80 hidden sm:inline">({formatNumber(currentSubscriberCount)})</span>
      )}
    </Button>
  );
}
