
export interface Channel {
  id: string;
  name: string;
  avatarUrl: string;
  subscribers: number; 
  description?: string;
  bannerUrl?: string;
}

export interface Video {
  id: string;
  title: string;
  thumbnailUrl: string; 
  highQualityThumbnailUrl?: string; 
  channel: Channel; 
  views: number; 
  uploadDate: string; 
  publishedAt: string; 
  duration: string; 
  description?: string;
  videoUrl?: string; 
  likeCount?: number; 
}

export interface AppComment {
  id: string; 
  videoId: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  text: string; 
  createdAt: Date; 
  updatedAt: Date; 
  likes: number;
  // replies?: AppComment[]; 
}

export interface WatchHistoryItem {
  id: string; 
  videoId: string;
  videoTitle: string;
  channelId: string;
  channelName: string;
  thumbnailUrl: string;
  watchedAt: Date; 
}

export interface SavedVideoItem {
  id: string; 
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelId: string;
  channelName: string;
  savedAt: Date; 
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  videoCount: number;
  publishedAt: string; 
}

export interface PlaylistItem {
  id: string; 
  playlistId: string;
  videoId: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  channelId: string; 
  channelTitle: string; 
  videoOwnerChannelId?: string; 
  videoOwnerChannelTitle?: string; 
  position: number;
  publishedAt: string; 
  videoPublishedAt?: string; 
}

export interface UserUploadedVideo {
  id: string; // Firestore document ID
  userId: string;
  title: string;
  description: string;
  videoUrl: string; // Download URL from Firebase Storage
  videoStoragePath: string; // Path in Firebase Storage
  thumbnailUrl: string; // URL or path to thumbnail (placeholder for now)
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: Date; // JS Date object
  views: number;
  likes: number;
  duration?: string; // Optional: if we can determine it
}
