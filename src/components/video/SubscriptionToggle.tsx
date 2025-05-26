'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import type { Channel } from '@/types';

interface SubscriptionToggleProps {
  channel: Channel;
  initialSubscribed?: boolean;
}

export function SubscriptionToggle({ channel, initialSubscribed = false }: SubscriptionToggleProps) {
  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed);
  const [subscriberCount, setSubscriberCount] = useState(channel.subscribers);

  const handleToggleSubscription = () => {
    setIsSubscribed(!isSubscribed);
    setSubscriberCount(prev => isSubscribed ? prev -1 : prev + 1);
    // Here you would typically make an API call
    console.log(isSubscribed ? `Unsubscribed from ${channel.name}` : `Subscribed to ${channel.name}`);
  };
  
  const formatSubscribers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };


  return (
    <Button 
      onClick={handleToggleSubscription}
      variant={isSubscribed ? 'secondary' : 'default'}
      className="min-w-[120px]"
    >
      {isSubscribed ? <BellOff className="mr-2 h-4 w-4" /> : <Bell className="mr-2 h-4 w-4" />}
      {isSubscribed ? 'Subscribed' : 'Subscribe'} 
      <span className="ml-1.5 text-xs opacity-80">({formatSubscribers(subscriberCount)})</span>
    </Button>
  );
}
