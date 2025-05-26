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

export interface Comment {
  id:string;
  videoId: string;
  user: {
    name: string;
    avatarUrl: string;
    channelId?: string; // YouTube comment author can be a channel
  };
  text: string; // HTML content for comments
  timestamp: string; // Formatted string
  publishedAt: string; // ISO date string
  likes: number;
  replyCount?: number;
  replies?: Comment[]; // For nested replies if fetched
}
