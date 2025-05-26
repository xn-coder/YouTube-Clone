import type { Video, Comment, Channel } from '@/types';

export const mockChannels: Channel[] = [
  { id: 'channel1', name: 'TechFlow', avatarUrl: 'https://placehold.co/40x40.png', subscribers: 1200000 },
  { id: 'channel2', name: 'GamerHub', avatarUrl: 'https://placehold.co/40x40.png', subscribers: 2500000 },
  { id: 'channel3', name: 'MusicWave', avatarUrl: 'https://placehold.co/40x40.png', subscribers: 500000 },
  { id: 'channel4', name: 'KitchenDelights', avatarUrl: 'https://placehold.co/40x40.png', subscribers: 750000 },
];

export const mockVideos: Video[] = [
  {
    id: 'video1',
    title: 'The Future of AI - A Deep Dive',
    thumbnailUrl: 'https://placehold.co/360x200.png',
    channel: mockChannels[0],
    views: '1.2M views',
    uploadDate: '2 weeks ago',
    duration: '15:45',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    description: 'Explore the latest advancements in Artificial Intelligence and what the future holds. A comprehensive look at machine learning, neural networks, and ethical considerations.'
  },
  {
    id: 'video2',
    title: 'Epic Gaming Moments Compilation #23',
    thumbnailUrl: 'https://placehold.co/360x200.png',
    channel: mockChannels[1],
    views: '3.5M views',
    uploadDate: '5 days ago',
    duration: '10:32',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    description: 'Check out the most epic and hilarious gaming moments from the past week. Featuring top plays and funny fails from various games.'
  },
  {
    id: 'video3',
    title: 'Learn to Play Guitar: Beginner Chords',
    thumbnailUrl: 'https://placehold.co/360x200.png',
    channel: mockChannels[2],
    views: '800K views',
    uploadDate: '1 month ago',
    duration: '22:10',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    description: 'A beginner-friendly guitar tutorial covering the basic chords you need to start playing your favorite songs. Easy to follow along!'
  },
  {
    id: 'video4',
    title: 'Delicious Pasta Recipe in 20 Minutes',
    thumbnailUrl: 'https://placehold.co/360x200.png',
    channel: mockChannels[3],
    views: '550K views',
    uploadDate: '3 days ago',
    duration: '08:17',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    description: 'Whip up a delicious and satisfying pasta dish in just 20 minutes! Perfect for a quick weeknight meal. Full recipe in the description.'
  },
  {
    id: 'video5',
    title: 'Exploring the Cosmos: A Journey Through Galaxies',
    thumbnailUrl: 'https://placehold.co/360x200.png',
    channel: mockChannels[0],
    views: '950K views',
    uploadDate: '10 days ago',
    duration: '25:00',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    description: 'Embark on a breathtaking journey through distant galaxies and nebulae. Stunning visuals and fascinating facts about our universe.'
  },
  {
    id: 'video6',
    title: 'Top 10 Indie Games of the Year',
    thumbnailUrl: 'https://placehold.co/360x200.png',
    channel: mockChannels[1],
    views: '1.8M views',
    uploadDate: '1 week ago',
    duration: '18:30',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    description: 'Our picks for the top 10 indie games released this year. Discover hidden gems and innovative gameplay experiences.'
  },
   {
    id: 'video7',
    title: 'Acoustic Cover Session: Popular Hits',
    thumbnailUrl: 'https://placehold.co/360x200.png',
    channel: mockChannels[2],
    views: '620K views',
    uploadDate: '6 days ago',
    duration: '12:55',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    description: 'Relax and enjoy this acoustic session featuring covers of popular hit songs. Perfect for unwinding.'
  },
  {
    id: 'video8',
    title: 'Healthy Breakfast Ideas for Busy Mornings',
    thumbnailUrl: 'https://placehold.co/360x200.png',
    channel: mockChannels[3],
    views: '300K views',
    uploadDate: '2 days ago',
    duration: '07:03',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    description: 'Quick and healthy breakfast ideas that are perfect for those busy mornings. Start your day right with these nutritious recipes.'
  }
];

export const mockComments: Comment[] = [
  {
    id: 'comment1',
    videoId: 'video1',
    user: { name: 'Alice Wonderland', avatarUrl: 'https://placehold.co/32x32.png' },
    text: 'This was incredibly insightful! Thanks for sharing.',
    timestamp: '2 days ago',
    likes: 152,
    replies: [
      {
        id: 'reply1',
        videoId: 'video1',
        user: { name: 'Bob The Builder', avatarUrl: 'https://placehold.co/24x24.png' },
        text: 'Agreed! I learned so much.',
        timestamp: '1 day ago',
        likes: 34,
      }
    ]
  },
  {
    id: 'comment2',
    videoId: 'video1',
    user: { name: 'Charlie Brown', avatarUrl: 'https://placehold.co/32x32.png' },
    text: 'Great video, very well explained.',
    timestamp: '1 day ago',
    likes: 89,
  },
  {
    id: 'comment3',
    videoId: 'video2',
    user: { name: 'Diana Prince', avatarUrl: 'https://placehold.co/32x32.png' },
    text: 'LOL, that #3 clip was hilarious!',
    timestamp: '5 hours ago',
    likes: 230,
  },
];

export const getVideos = async (): Promise<Video[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockVideos;
};

export const getVideoById = async (id: string): Promise<Video | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockVideos.find(video => video.id === id);
};

export const getCommentsByVideoId = async (videoId: string): Promise<Comment[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return mockComments.filter(comment => comment.videoId === videoId);
};

export const searchVideos = async (query: string): Promise<Video[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  if (!query) return mockVideos;
  return mockVideos.filter(video => 
    video.title.toLowerCase().includes(query.toLowerCase()) ||
    video.channel.name.toLowerCase().includes(query.toLowerCase()) ||
    video.description?.toLowerCase().includes(query.toLowerCase())
  );
};

// Mock for subscribed channels' videos
export const getSubscribedVideos = async (): Promise<Video[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  // For now, return a subset of videos, e.g., from first two channels
  return mockVideos.filter(video => video.channel.id === mockChannels[0].id || video.channel.id === mockChannels[1].id);
};

// Mock for recommended videos
export const getRecommendedVideos = async (currentVideoId?: string): Promise<Video[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  // Simple recommendation: return other videos, excluding the current one
  return mockVideos.filter(video => video.id !== currentVideoId).slice(0, 5);
};
