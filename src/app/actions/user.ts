
'use server';

import { fetchChannelData } from '@/lib/data';
import type { Channel, UserUploadedVideo, WatchHistoryItem } from '@/types';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, orderBy, getDocs, serverTimestamp, Timestamp, setDoc, where, limit, Blob as FirestoreBlob } from 'firebase/firestore';

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
    const historyDocRef = doc(historyCollectionRef, videoDetails.videoId); 
    
    await setDoc(historyDocRef, {
      ...videoDetails,
      watchedAt: serverTimestamp(), 
    }, { merge: true }); 

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
        id: docSnap.id, 
        videoId: data.videoId,
        videoTitle: data.videoTitle,
        channelId: data.channelId,
        channelName: data.channelName,
        thumbnailUrl: data.thumbnailUrl,
        watchedAt: watchedAtTimestamp ? watchedAtTimestamp.toDate() : new Date(), 
      });
    });
    return history;
  } catch (error) {
    console.error('Error fetching watch history:', error);
    return [];
  }
}

// USER UPLOADED VIDEOS
export async function getUserUploadedVideos(userId: string): Promise<UserUploadedVideo[]> {
  if (!userId) {
    console.warn('getUserUploadedVideos called without userId');
    return [];
  }
  try {
    const videosCollectionRef = collection(db, 'userUploadedVideos');
    const q = query(videosCollectionRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const createdAtTimestamp = data.createdAt as Timestamp;
      return {
        id: docSnap.id,
        userId: data.userId,
        title: data.title,
        description: data.description,
        videoDataBlob: data.videoDataBlob, // Keep as Firestore Blob type initially
        fileType: data.fileType,
        thumbnailUrl: data.thumbnailUrl || 'https://placehold.co/320x180.png',
        fileName: data.fileName,
        fileSize: data.fileSize,
        createdAt: createdAtTimestamp ? createdAtTimestamp.toDate() : new Date(),
        views: data.views || 0,
        likes: data.likes || 0,
        duration: data.duration,
      } as UserUploadedVideo; // Type assertion, ensure fields match
    });
  } catch (error) {
    console.error(`Error fetching uploaded videos for user ${userId}:`, error);
    return [];
  }
}

export async function getUploadedVideoById(firestoreVideoId: string): Promise<UserUploadedVideo | null> {
  if (!firestoreVideoId) {
    console.warn('getUploadedVideoById called with no ID');
    return null;
  }
  try {
    const videoDocRef = doc(db, 'userUploadedVideos', firestoreVideoId);
    const docSnap = await getDoc(videoDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const createdAtTimestamp = data.createdAt as Timestamp;
      return {
        id: docSnap.id,
        userId: data.userId,
        title: data.title,
        description: data.description,
        videoDataBlob: data.videoDataBlob, // Keep as Firestore Blob
        fileType: data.fileType,
        thumbnailUrl: data.thumbnailUrl || 'https://placehold.co/320x180.png',
        fileName: data.fileName,
        fileSize: data.fileSize,
        createdAt: createdAtTimestamp ? createdAtTimestamp.toDate() : new Date(),
        views: data.views || 0,
        likes: data.likes || 0,
        duration: data.duration,
      } as UserUploadedVideo; // Type assertion
    } else {
      console.warn(`No uploaded video found with ID: ${firestoreVideoId}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching uploaded video by ID ${firestoreVideoId}:`, error);
    return null;
  }
}
