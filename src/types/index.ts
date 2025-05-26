export interface Channel {
  id: string;
  name: string;
  avatarUrl: string;
  subscribers: number;
}

export interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
  channel: Channel;
  views: string; // e.g., "1M views"
  uploadDate: string; // e.g., "2 weeks ago"
  duration: string; // e.g., "10:32"
  description?: string;
  videoUrl?: string; // URL to the actual video file or stream
}

export interface Comment {
  id: string;
  videoId: string;
  user: {
    name: string;
    avatarUrl: string;
  };
  text: string;
  timestamp: string; // e.g., "3 days ago"
  likes: number;
  replies?: Comment[];
}
