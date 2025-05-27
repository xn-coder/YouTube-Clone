
'use server';

import type { AppComment, SavedVideoItem, Video } from '@/types';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
  deleteDoc,
  writeBatch,
  setDoc
} from 'firebase/firestore';

// COMMENTS

export async function addAppComment(
  videoId: string,
  userId: string,
  userName: string,
  userAvatarUrl: string | null | undefined,
  text: string
): Promise<{ success: boolean; comment?: AppComment, error?: string }> {
  if (!userId || !text.trim()) {
    return { success: false, error: 'User ID and comment text are required.' };
  }
  try {
    const commentData = {
      videoId,
      userId,
      userName: userName || 'Anonymous',
      userAvatarUrl: userAvatarUrl || null,
      text,
      createdAt: serverTimestamp(), // Firestore server timestamp for storage
      updatedAt: serverTimestamp(), // Firestore server timestamp for storage
      likes: 0,
      replies: [] // For future use
    };
    const docRef = await addDoc(collection(db, `videoInteractions/${videoId}/comments`), commentData);

    // For optimistic update, return a comment object with JS Date objects
    return {
      success: true,
      comment: {
        id: docRef.id,
        videoId,
        userId,
        userName: userName || 'Anonymous',
        userAvatarUrl: userAvatarUrl || null,
        text,
        createdAt: new Date(), // Current client/server time for optimistic update
        updatedAt: new Date(), // Current client/server time for optimistic update
        likes: 0,
        // replies: []
      } as AppComment,
    };
  } catch (error: any) {
    console.error('Error adding comment:', error);
    return { success: false, error: error.message || 'Failed to add comment.' };
  }
}

export async function getAppComments(videoId: string): Promise<AppComment[]> {
  try {
    const commentsColRef = collection(db, `videoInteractions/${videoId}/comments`);
    const q = query(commentsColRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      
      // Ensure createdAt and updatedAt are JavaScript Date objects
      let createdAtDate, updatedAtDate;

      if (data.createdAt instanceof Timestamp) {
        createdAtDate = data.createdAt.toDate();
      } else if (data.createdAt && typeof data.createdAt.seconds === 'number') {
        // Handle cases where it might be a plain object resembling a Timestamp
        createdAtDate = new Timestamp(data.createdAt.seconds, data.createdAt.nanoseconds).toDate();
      } else {
        // Fallback if createdAt is missing or in an unexpected format
        console.warn(`Comment ${docSnap.id} has missing or invalid createdAt. Using current date as fallback.`);
        createdAtDate = new Date(); 
      }

      if (data.updatedAt instanceof Timestamp) {
        updatedAtDate = data.updatedAt.toDate();
      } else if (data.updatedAt && typeof data.updatedAt.seconds === 'number') {
        updatedAtDate = new Timestamp(data.updatedAt.seconds, data.updatedAt.nanoseconds).toDate();
      } else {
        updatedAtDate = new Date(); // Fallback
      }

      return {
        id: docSnap.id,
        videoId: data.videoId || '',
        userId: data.userId || '',
        userName: data.userName || 'Anonymous',
        userAvatarUrl: data.userAvatarUrl || null,
        text: data.text || '',
        createdAt: createdAtDate,
        updatedAt: updatedAtDate,
        likes: data.likes || 0,
        // replies: data.replies || [],
      } as AppComment; // Casting, ensure all AppComment fields are covered
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

// SAVED VIDEOS

export async function toggleSaveVideo(
  userId: string,
  videoData: {
    videoId: string;
    title: string;
    thumbnailUrl: string;
    channelId: string;
    channelName: string;
  }
): Promise<{ success: boolean; isSaved: boolean; error?: string }> {
  if (!userId) {
    return { success: false, isSaved: false, error: 'User ID is required.' };
  }
  const userDocRef = doc(db, 'users', userId);

  try {
    // Prepare the video item with a client-generated timestamp for array operations
    const videoItemForStorage = {
      videoId: videoData.videoId,
      title: videoData.title,
      thumbnailUrl: videoData.thumbnailUrl,
      channelId: videoData.channelId,
      channelName: videoData.channelName,
      savedAt: new Date() // Use JavaScript Date; Firestore converts to Timestamp
    };

    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const savedVideosArray: Array<Omit<SavedVideoItem, 'id' | 'savedAt'> & { savedAt: Date | Timestamp }> = userData.savedVideos || [];
      
      const existingVideoInArray = savedVideosArray.find(v => v.videoId === videoData.videoId);

      if (existingVideoInArray) {
        await updateDoc(userDocRef, {
          savedVideos: arrayRemove(existingVideoInArray)
        });
        return { success: true, isSaved: false };
      } else {
        await updateDoc(userDocRef, {
          savedVideos: arrayUnion(videoItemForStorage)
        });
        return { success: true, isSaved: true };
      }
    } else {
      // User document doesn't exist, create it and add the video.
      await setDoc(userDocRef, { 
        savedVideos: [videoItemForStorage],
        // Initialize other user fields if this is the first time the doc is created
        email: '', // Consider fetching user's email if available from Auth context or pass it
        uid: userId,
        createdAt: serverTimestamp(), // Use serverTimestamp for document creation time
        subscribedChannelIds: [], 
      });
      return { success: true, isSaved: true };
    }
  } catch (error: any) {
    console.error('Error toggling save video:', error);
    return { success: false, isSaved: false, error: error.message || 'Failed to update saved videos.' };
  }
}


export async function isUserVideoSaved(userId: string, videoId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const savedVideosArray: Partial<SavedVideoItem>[] = userData.savedVideos || [];
      return savedVideosArray.some(v => v.videoId === videoId);
    }
    return false;
  } catch (error) {
    console.error('Error checking if video is saved:', error);
    return false;
  }
}

export async function getSavedVideos(userId: string): Promise<SavedVideoItem[]> {
  if (!userId) {
    return [];
  }
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const savedVideosData = (userData.savedVideos || []) as Array<any>;
      
      const processedVideos = savedVideosData.map((item, index) => {
        let savedAtDate;
        if (item.savedAt instanceof Timestamp) {
          savedAtDate = item.savedAt.toDate();
        } else if (item.savedAt && typeof item.savedAt.seconds === 'number') {
          savedAtDate = new Timestamp(item.savedAt.seconds, item.savedAt.nanoseconds).toDate();
        } else {
          savedAtDate = new Date(); // Fallback
        }
        return {
          ...item,
          id: item.videoId || `saved-${index}`, 
          savedAt: savedAtDate,
        };
      }).sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime()); 

      return processedVideos as SavedVideoItem[];
    }
    return [];
  } catch (error) {
    console.error('Error fetching saved videos:', error);
    return [];
  }
}
