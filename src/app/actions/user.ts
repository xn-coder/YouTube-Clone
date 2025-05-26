
'use server';

import { fetchChannelData } from '@/lib/data';
import type { Channel } from '@/types';
import { db } from '@/lib/firebase'; // Import Firestore db instance
import { doc, getDoc } from 'firebase/firestore';

export interface ChannelPreview {
  id: string;
  name: string;
  avatarUrl: string;
}

export async function getSubscribedChannelPreviews(userId?: string): Promise<ChannelPreview[]> {
  if (!userId) {
    // If no userId is provided (e.g., user not logged in), return an empty array.
    return [];
  }

  let subscribedChannelIds: string[] = [];
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      subscribedChannelIds = userData.subscribedChannelIds || [];
    } else {
      // User document doesn't exist, so no subscriptions.
      console.log(`No user document found for userId: ${userId} in getSubscribedChannelPreviews.`);
      return [];
    }
  } catch (error) {
    console.error("Error fetching user's subscribed channel IDs from Firestore:", error);
    return []; // Return empty on error
  }
  
  if (subscribedChannelIds.length === 0) {
    return [];
  }

  try {
    const channelMap = await fetchChannelData(subscribedChannelIds);
    
    const previews: ChannelPreview[] = [];
    for (const id of subscribedChannelIds) { // Iterate over actual subscribed IDs
      const channel = channelMap.get(id);
      if (channel) {
        previews.push({
          id: channel.id,
          name: channel.name,
          avatarUrl: channel.avatarUrl,
        });
      }
    }
    return previews;
  } catch (error) {
    console.error("Error fetching subscribed channel previews from YouTube API:", error);
    return [];
  }
}
