
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import type { Channel } from '@/types';
import { formatNumber } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';

interface SubscriptionToggleProps {
  channel: Channel;
  // initialSubscribed is no longer needed as we fetch from Firestore
}

export function SubscriptionToggle({ channel }: SubscriptionToggleProps) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoadingSubscriptionStatus, setIsLoadingSubscriptionStatus] = useState(true);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (authLoading) {
        setIsLoadingSubscriptionStatus(true);
        return;
      }
      if (!user) {
        setIsSubscribed(false);
        setIsLoadingSubscriptionStatus(false);
        return;
      }

      setIsLoadingSubscriptionStatus(true);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setIsSubscribed(userData.subscribedChannelIds?.includes(channel.id) || false);
        } else {
          setIsSubscribed(false); // User document might not exist yet
        }
      } catch (error) {
        console.error("Error fetching subscription status:", error);
        toast({ title: 'Error', description: 'Could not fetch subscription status.', variant: 'destructive' });
        setIsSubscribed(false); // Default to not subscribed on error
      } finally {
        setIsLoadingSubscriptionStatus(false);
      }
    };

    fetchSubscriptionStatus();
  }, [user, authLoading, channel.id, toast]);

  const handleToggleSubscription = async () => {
    if (authLoading || isLoadingSubscriptionStatus) return;

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

    setIsLoadingSubscriptionStatus(true); // Indicate an action is in progress
    const userDocRef = doc(db, 'users', user.uid);

    try {
      if (isSubscribed) { // User wants to unsubscribe
        await updateDoc(userDocRef, {
          subscribedChannelIds: arrayRemove(channel.id)
        });
        setIsSubscribed(false);
        toast({ title: 'Unsubscribed', description: `You have unsubscribed from ${channel.name}.` });
      } else { // User wants to subscribe
        // Ensure user document exists, then add subscription
        // Using setDoc with merge:true is an alternative to checking existence first
        // but arrayUnion/arrayRemove require the document to exist for updateDoc.
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
            // If user document doesn't exist (e.g., old user, or Firestore creation failed at signup)
            // create it with the subscription.
             await setDoc(userDocRef, { 
                subscribedChannelIds: [channel.id],
                email: user.email, // good to store some basic info
                uid: user.uid,
             }, { merge: true }); // merge:true ensures we don't overwrite other fields if they exist
        } else {
            await updateDoc(userDocRef, {
              subscribedChannelIds: arrayUnion(channel.id)
            });
        }
        setIsSubscribed(true);
        toast({ title: 'Subscribed!', description: `You are now subscribed to ${channel.name}.` });
      }
    } catch (error) {
      console.error("Failed to update subscription:", error);
      // No need to revert isSubscribed here, as the state is re-fetched or represents the target state
      toast({ title: 'Error', description: 'Could not update subscription. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoadingSubscriptionStatus(false);
    }
  };
  
  if (authLoading || isLoadingSubscriptionStatus) {
    return <Skeleton className="h-9 w-[130px] sm:w-[150px] rounded-md" />;
  }
  
  const currentSubscriberCount = channel.subscribers;

  return (
    <Button 
      onClick={handleToggleSubscription}
      variant={isSubscribed ? 'secondary' : 'default'} 
      className="min-w-[130px] sm:min-w-[150px] text-xs sm:text-sm"
      disabled={authLoading || isLoadingSubscriptionStatus}
    >
      {isSubscribed ? <BellOff className="mr-1.5 h-4 w-4" /> : <Bell className="mr-1.5 h-4 w-4" />}
      {isSubscribed ? 'Subscribed' : 'Subscribe'} 
      {currentSubscriberCount > 0 && (
        <span className="ml-1.5 text-xs opacity-80 hidden sm:inline">({formatNumber(currentSubscriberCount)})</span>
      )}
    </Button>
  );
}
