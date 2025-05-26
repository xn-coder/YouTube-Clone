
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likes: 0,
      replies: [] // For future use
    };
    const docRef = await addDoc(collection(db, `videoInteractions/${videoId}/comments`), commentData);

    // To return the full comment object including the Firestore-generated ID and timestamp,
    // we'd ideally fetch it again, but for simplicity, we'll construct it.
    // Note: `createdAt` will be null locally until fetched from server or page reloads.
    return {
      success: true,
      comment: {
        id: docRef.id,
        ...commentData,
        createdAt: new Date(), // Placeholder, actual value is server timestamp
        updatedAt: new Date(),
      } as AppComment, // Cast because serverTimestamp resolves to Timestamp
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
      return {
        id: docSnap.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      } as AppComment;
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
      // Ensure savedVideos is treated as an array, even if missing or null initially
      // The items in savedVideosArray will have `savedAt` as Firestore Timestamps when read
      const savedVideosArray: Array<Omit<SavedVideoItem, 'id' | 'savedAt'> & { savedAt: Date | Timestamp }> = userData.savedVideos || [];
      
      const existingVideoInArray = savedVideosArray.find(v => v.videoId === videoData.videoId);

      if (existingVideoInArray) {
        // Video exists, remove it. Pass the object as it was read from Firestore.
        await updateDoc(userDocRef, {
          savedVideos: arrayRemove(existingVideoInArray)
        });
        return { success: true, isSaved: false };
      } else {
        // Video doesn't exist in array, add it.
        // videoItemForStorage uses `new Date()` for `savedAt`.
        await updateDoc(userDocRef, {
          savedVideos: arrayUnion(videoItemForStorage)
        });
        return { success: true, isSaved: true };
      }
    } else {
      // User document doesn't exist, create it and add the video.
      // This path implies we are saving the video for the first time for this user.
      await setDoc(userDocRef, { 
        savedVideos: [videoItemForStorage],
        // Consider initializing other user fields here if this is the first time the doc is created,
        // e.g., email, uid, createdAt (using serverTimestamp() here is fine for setDoc).
        // For simplicity, assuming `users` docs are primarily for `subscribedChannelIds` and `savedVideos` for now.
        // If user profile details are created elsewhere (e.g., on signup), merge:true could be used
        // await setDoc(userDocRef, { savedVideos: [videoItemForStorage] }, { merge: true });
      });
      return { success: true, isSaved: true };
    }
  } catch (error: any)
{
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
      // Ensure savedVideos is an array and items have savedAt, then convert Timestamp
      const savedVideosData = (userData.savedVideos || []) as Array<any>;
      
      const processedVideos = savedVideosData.map((item, index) => ({
        ...item,
        id: item.videoId || `saved-${index}`, // Ensure an ID if not directly part of stored object
        savedAt: (item.savedAt as Timestamp)?.toDate ? (item.savedAt as Timestamp).toDate() : new Date(),
      })).sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime()); // Sort by most recently saved

      return processedVideos as SavedVideoItem[];
    }
    return [];
  } catch (error) {
    console.error('Error fetching saved videos:', error);
    return [];
  }
}
