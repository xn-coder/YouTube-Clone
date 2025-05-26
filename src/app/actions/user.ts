
'use server';

import { fetchChannelData } from '@/lib/data';
import type { Channel, WatchHistoryItem } from '@/types';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, orderBy, getDocs, serverTimestamp, Timestamp, setDoc } from 'firebase/firestore';

export interface ChannelPreview {
  id: string;
  name: string;
  avatarUrl: string;
}

export async function getSubscribedChannelPreviews(userId?: string): Promise<ChannelPreview[]> {
  if (!userId) {
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
      console.log(`No user document found for userId: ${userId} in getSubscribedChannelPreviews.`);
      return [];
    }
  } catch (error) {
    console.error("Error fetching user's subscribed channel IDs from Firestore:", error);
    return [];
  }
  
  if (subscribedChannelIds.length === 0) {
    return [];
  }

  try {
    const channelMap = await fetchChannelData(subscribedChannelIds);
    
    const previews: ChannelPreview[] = [];
    for (const id of subscribedChannelIds) {
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

export async function recordWatchEvent(
  userId: string,
  videoDetails: {
    videoId: string;
    videoTitle: string;
    channelId: string;
    channelName: string;
    thumbnailUrl: string;
  }
): Promise<{ success: boolean; message?: string }> {
  if (!userId) {
    return { success: false, message: 'User ID is required.' };
  }
  if (!videoDetails.videoId) {
    return { success: false, message: 'Video ID is required.' };
  }

  try {
    const historyCollectionRef = collection(db, 'users', userId, 'watchHistory');
    // Use videoId as the document ID to easily update/overwrite if watched again,
    // or use addDoc for unique entries if multiple views of same video should be separate records.
    // For simplicity, let's assume we just want to record the latest watch time for a video.
    // If multiple distinct watch events are needed, use addDoc().
    const historyDocRef = doc(historyCollectionRef, videoDetails.videoId); 
    
    await setDoc(historyDocRef, {
      ...videoDetails,
      watchedAt: serverTimestamp(), // Firestore server timestamp
    }, { merge: true }); // Merge true to update watchedAt if doc exists

    return { success: true };
  } catch (error: any) {
    console.error('Error recording watch event:', error);
    return { success: false, message: error.message || 'Failed to record watch event.' };
  }
}

export async function getWatchHistory(userId: string): Promise<WatchHistoryItem[]> {
  if (!userId) {
    return [];
  }

  try {
    const historyCollectionRef = collection(db, 'users', userId, 'watchHistory');
    const q = query(historyCollectionRef, orderBy('watchedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const history: WatchHistoryItem[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const watchedAtTimestamp = data.watchedAt as Timestamp;
      history.push({
        id: docSnap.id, // This is the videoId if we used doc(historyCollectionRef, videoDetails.videoId)
        videoId: data.videoId,
        videoTitle: data.videoTitle,
        channelId: data.channelId,
        channelName: data.channelName,
        thumbnailUrl: data.thumbnailUrl,
        watchedAt: watchedAtTimestamp ? watchedAtTimestamp.toDate() : new Date(), // Convert Firestore Timestamp
      });
    });
    return history;
  } catch (error) {
    console.error('Error fetching watch history:', error);
    return [];
  }
}
