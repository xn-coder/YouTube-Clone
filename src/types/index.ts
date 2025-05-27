

export interface Channel {
  id: string;
  name: string;
  avatarUrl: string;
  subscribers: number; // Store as number for potential calculations, format for display
  description?: string;
  bannerUrl?: string;
}

export interface Video {
  id: string;
  title: string;
  thumbnailUrl: string; // Default/Medium quality for cards
  highQualityThumbnailUrl?: string; // Higher quality for player poster
  channel: Channel; // Simplified, will be populated carefully
  views: number; // Store as number
  uploadDate: string; // Formatted string like "2 weeks ago"
  publishedAt: string; // ISO date string from API
  duration: string; // Formatted string like "10:32"
  description?: string;
  videoUrl?: string; // Actual video file (not directly from YT API for embedding usually)
  likeCount?: number; // Store as number
}

export interface AppComment {
  id: string; // Firestore document ID
  videoId: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  text: string; // HTML content, or plain text if sanitized before storing
  createdAt: Date; // JS Date object, converted from Firestore Timestamp
  updatedAt: Date; // JS Date object
  likes: number;
  // replies?: AppComment[]; // For nested replies if implemented
}

export interface WatchHistoryItem {
  id: string; // Firestore document ID (usually videoId if we overwrite, or unique if multiple views)
  videoId: string;
  videoTitle: string;
  channelId: string;
  channelName: string;
  thumbnailUrl: string;
  watchedAt: Date; // JS Date object, converted from Firestore Timestamp
}

export interface SavedVideoItem {
  id: string; // videoId can serve as a unique ID within the array
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelId: string;
  channelName: string;
  savedAt: Date; // JS Date object, from Firestore Timestamp
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  videoCount: number;
  publishedAt: string; // ISO date string
}

export interface PlaylistItem {
  id: string; // This is the playlist item ID from YouTube API, not the video ID
  playlistId: string;
  videoId: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  channelId: string; // Channel that owns the playlist
  channelTitle: string; // Channel that owns the playlist
  videoOwnerChannelId?: string; // Channel that owns the video
  videoOwnerChannelTitle?: string; // Channel that owns the video
  position: number;
  publishedAt: string; // When the video was added to the playlist
  videoPublishedAt?: string; // When the video itself was published
}
