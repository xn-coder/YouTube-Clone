import type { Video, Comment, Channel } from '@/types';
import { formatNumber, parseISO8601Duration, formatPublishedAt } from '@/lib/utils';

const API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

// Helper to fetch channel details (including avatar and subscribers)
async function fetchChannelData(channelIds: string[]): Promise<Map<string, Channel>> {
  if (!API_KEY) throw new Error('YOUTUBE_API_KEY is not set.');
  if (channelIds.length === 0) return new Map();

  const response = await fetch(
    `${API_BASE_URL}/channels?part=snippet,statistics,brandingSettings&id=${channelIds.join(',')}&key=${API_KEY}`
  );
  if (!response.ok) {
    const errorData = await response.json();
    console.error('YouTube API Error (fetchChannelData):', errorData);
    throw new Error(`YouTube API error: ${errorData.error?.message || response.statusText}`);
  }
  const data = await response.json();
  
  const channelMap = new Map<string, Channel>();
  data.items?.forEach((item: any) => {
    channelMap.set(item.id, {
      id: item.id,
      name: item.snippet?.title || 'Unknown Channel',
      avatarUrl: item.snippet?.thumbnails?.default?.url || 'https://placehold.co/40x40.png',
      subscribers: parseInt(item.statistics?.subscriberCount || '0', 10),
      description: item.snippet?.description,
      bannerUrl: item.brandingSettings?.image?.bannerExternalUrl,
    });
  });
  return channelMap;
}

// Helper to transform YouTube API video item to our Video type
async function transformVideoItem(item: any, channelMap: Map<string, Channel>): Promise<Video> {
  const channelId = item.snippet?.channelId;
  let channel = channelMap.get(channelId);

  if (!channel && channelId) {
    // Fetch if not in map (e.g. for getVideoById if channelMap isn't pre-populated for it)
    const singleChannelMap = await fetchChannelData([channelId]);
    channel = singleChannelMap.get(channelId);
  }
  
  const videoId = typeof item.id === 'string' ? item.id : item.id?.videoId;

  return {
    id: videoId,
    title: item.snippet?.title || 'Untitled Video',
    thumbnailUrl: item.snippet?.thumbnails?.medium?.url || 'https://placehold.co/360x200.png',
    highQualityThumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.standard?.url || item.snippet?.thumbnails?.medium?.url,
    channel: channel || { 
      id: channelId || 'unknown', 
      name: item.snippet?.channelTitle || 'Unknown Channel', 
      avatarUrl: 'https://placehold.co/40x40.png', 
      subscribers: 0 
    },
    views: parseInt(item.statistics?.viewCount || '0', 10),
    uploadDate: formatPublishedAt(item.snippet?.publishedAt),
    publishedAt: item.snippet?.publishedAt,
    duration: parseISO8601Duration(item.contentDetails?.duration),
    description: item.snippet?.description,
    likeCount: parseInt(item.statistics?.likeCount || '0', 10),
    // videoUrl: actual video file, not standard from YT API search/videos list
  };
}

export const getVideos = async (maxResults: number = 20): Promise<Video[]> => {
  if (!API_KEY) {
    console.error('YOUTUBE_API_KEY is not set. Returning empty array for getVideos.');
    return [];
  }
  try {
    const response = await fetch(
      `${API_BASE_URL}/videos?part=snippet,contentDetails,statistics&chart=mostPopular&regionCode=US&maxResults=${maxResults}&key=${API_KEY}`
    );
    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API Error (getVideos):', errorData.error?.message);
      return [];
    }
    const data = await response.json();
    if (!data.items) return [];

    const channelIds = [...new Set(data.items.map((item: any) => item.snippet?.channelId).filter(Boolean))];
    const channelMap = await fetchChannelData(channelIds);
    
    return Promise.all(data.items.map((item: any) => transformVideoItem(item, channelMap)));
  } catch (error) {
    console.error('Error fetching popular videos:', error);
    return [];
  }
};

export const getVideoById = async (id: string): Promise<Video | undefined> => {
  if (!API_KEY) {
    console.error('YOUTUBE_API_KEY is not set. Returning undefined for getVideoById.');
    return undefined;
  }
  try {
    const response = await fetch(
      `${API_BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${id}&key=${API_KEY}`
    );
    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API Error (getVideoById):', errorData.error?.message);
      return undefined;
    }
    const data = await response.json();
    if (!data.items || data.items.length === 0) return undefined;

    // Channel data will be fetched by transformVideoItem if not passed
    return transformVideoItem(data.items[0], new Map());
  } catch (error) {
    console.error(`Error fetching video by ID (${id}):`, error);
    return undefined;
  }
};

export const getCommentsByVideoId = async (videoId: string, maxResults: number = 20): Promise<Comment[]> => {
  if (!API_KEY) {
    console.error('YOUTUBE_API_KEY is not set. Returning empty array for getCommentsByVideoId.');
    return [];
  }
  try {
    const response = await fetch(
      `${API_BASE_URL}/commentThreads?part=snippet,replies&videoId=${videoId}&maxResults=${maxResults}&textFormat=html&key=${API_KEY}`
    );
    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API Error (getCommentsByVideoId):', errorData.error?.message);
      return [];
    }
    const data = await response.json();

    return data.items?.map((item: any): Comment => {
      const topLevelComment = item.snippet?.topLevelComment?.snippet;
      return {
        id: item.snippet?.topLevelComment?.id,
        videoId: topLevelComment?.videoId,
        user: {
          name: topLevelComment?.authorDisplayName || 'User',
          avatarUrl: topLevelComment?.authorProfileImageUrl || 'https://placehold.co/32x32.png',
          channelId: topLevelComment?.authorChannelId?.value,
        },
        text: topLevelComment?.textDisplay || '', // textFormat=html returns HTML
        timestamp: formatPublishedAt(topLevelComment?.publishedAt),
        publishedAt: topLevelComment?.publishedAt,
        likes: parseInt(topLevelComment?.likeCount || '0', 10),
        replyCount: parseInt(item.snippet?.totalReplyCount || '0', 10),
        replies: item.replies?.comments?.map((replyItem: any): Comment => {
          const replySnippet = replyItem.snippet;
          return {
            id: replyItem.id,
            videoId: replySnippet?.videoId,
            user: {
              name: replySnippet?.authorDisplayName || 'User',
              avatarUrl: replySnippet?.authorProfileImageUrl || 'https://placehold.co/24x24.png',
              channelId: replySnippet?.authorChannelId?.value,
            },
            text: replySnippet?.textDisplay || '',
            timestamp: formatPublishedAt(replySnippet?.publishedAt),
            publishedAt: replySnippet?.publishedAt,
            likes: parseInt(replySnippet?.likeCount || '0', 10),
          };
        }) || [],
      };
    }) || [];
  } catch (error) {
    console.error(`Error fetching comments for video ID (${videoId}):`, error);
    return [];
  }
};

export const searchVideos = async (query: string, maxResults: number = 20): Promise<Video[]> => {
  if (!API_KEY) {
    console.error('YOUTUBE_API_KEY is not set. Returning empty array for searchVideos.');
    return [];
  }
  if (!query) return getVideos(maxResults); // Or return empty array: return [];
  
  try {
    const searchResponse = await fetch(
      `${API_BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=${maxResults}&type=video&key=${API_KEY}`
    );
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error('YouTube API Error (searchVideos - search):', errorData.error?.message);
      return [];
    }
    const searchData = await searchResponse.json();
    if (!searchData.items || searchData.items.length === 0) return [];

    const videoIds = searchData.items.map((item: any) => item.id?.videoId).filter(Boolean);
    if (videoIds.length === 0) return [];

    const videosResponse = await fetch(
      `${API_BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${API_KEY}`
    );
    if (!videosResponse.ok) {
      const errorData = await videosResponse.json();
      console.error('YouTube API Error (searchVideos - videos):', errorData.error?.message);
      // Fallback: try to construct partial video data from search results
      const channelIdsFromSearch = [...new Set(searchData.items.map((item: any) => item.snippet?.channelId).filter(Boolean))];
      const channelMapFromSearch = await fetchChannelData(channelIdsFromSearch);
      return Promise.all(searchData.items.map((item: any) => transformVideoItem(item, channelMapFromSearch)));
    }
    const videosData = await videosResponse.json();
    if (!videosData.items) return [];
    
    const channelIds = [...new Set(videosData.items.map((item: any) => item.snippet?.channelId).filter(Boolean))];
    const channelMap = await fetchChannelData(channelIds);

    // Preserve order from search results
    const videosById = new Map(videosData.items.map((video: any) => [video.id, video]));
    const orderedVideos = videoIds.map((id: string) => videosById.get(id)).filter(Boolean);

    return Promise.all(orderedVideos.map((item: any) => transformVideoItem(item, channelMap)));
  } catch (error) {
    console.error(`Error searching videos for query "${query}":`, error);
    return [];
  }
};

// Example channel IDs for subscriptions. Replace with actual IDs or a different logic.
const SUBSCRIBED_CHANNEL_IDS = [
  'UC_x5XG1OV2P6uZZ5FSM9Ttw', // Google Developers
  'UCBJycsmduvYEL83R_U4JriQ', // Marques Brownlee (MKBHD)
  'UCsT0YIqwnpJCM-mx7-gSA4Q', // Fireship
];

export const getSubscribedVideos = async (maxResultsPerChannel: number = 5): Promise<Video[]> => {
  if (!API_KEY) {
    console.error('YOUTUBE_API_KEY is not set. Returning empty array for getSubscribedVideos.');
    return [];
  }
  try {
    let allSubscribedVideos: Video[] = [];
    const channelMap = await fetchChannelData(SUBSCRIBED_CHANNEL_IDS);

    for (const channelId of SUBSCRIBED_CHANNEL_IDS) {
      const response = await fetch(
        `${API_BASE_URL}/search?part=snippet&channelId=${channelId}&maxResults=${maxResultsPerChannel}&order=date&type=video&key=${API_KEY}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.items) {
           const videoIds = data.items.map((item: any) => item.id?.videoId).filter(Boolean);
           if (videoIds.length > 0) {
             const videosDetailsResponse = await fetch(
               `${API_BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${API_KEY}`
             );
             if(videosDetailsResponse.ok) {
                const videoDetailsData = await videosDetailsResponse.json();
                const transformed = await Promise.all(videoDetailsData.items.map((item: any) => transformVideoItem(item, channelMap)));
                allSubscribedVideos.push(...transformed);
             }
           }
        }
      } else {
        const errorData = await response.json();
        console.error(`YouTube API Error (getSubscribedVideos for channel ${channelId}):`, errorData.error?.message);
      }
    }
    // Sort by published date, newest first
    allSubscribedVideos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    return allSubscribedVideos.slice(0, 20); // Overall limit
  } catch (error) {
    console.error('Error fetching subscribed videos:', error);
    return [];
  }
};

export const getRecommendedVideos = async (videoId: string, maxResults: number = 10): Promise<Video[]> => {
  if (!API_KEY) {
    console.error('YOUTUBE_API_KEY is not set. Returning empty array for getRecommendedVideos.');
    return [];
  }
  try {
    const searchResponse = await fetch(
      `${API_BASE_URL}/search?part=snippet&relatedToVideoId=${videoId}&type=video&maxResults=${maxResults}&key=${API_KEY}`
    );
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error('YouTube API Error (getRecommendedVideos - search):', errorData.error?.message);
      return [];
    }
    const searchData = await searchResponse.json();
    if (!searchData.items || searchData.items.length === 0) return [];

    const videoIds = searchData.items.map((item: any) => item.id?.videoId).filter(Boolean);
    if (videoIds.length === 0) return [];
    
    const videosResponse = await fetch(
      `${API_BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${API_KEY}`
    );
    if (!videosResponse.ok) {
        const errorData = await videosResponse.json();
        console.error('YouTube API Error (getRecommendedVideos - videos):', errorData.error?.message);
        const channelIdsFromSearch = [...new Set(searchData.items.map((item: any) => item.snippet?.channelId).filter(Boolean))];
        const channelMapFromSearch = await fetchChannelData(channelIdsFromSearch);
        return Promise.all(searchData.items.map((item: any) => transformVideoItem(item, channelMapFromSearch)));
    }
    const videosData = await videosResponse.json();
     if (!videosData.items) return [];

    const channelIds = [...new Set(videosData.items.map((item: any) => item.snippet?.channelId).filter(Boolean))];
    const channelMap = await fetchChannelData(channelIds);
    
    // Preserve order from recommendation results
    const videosById = new Map(videosData.items.map((video: any) => [video.id, video]));
    const orderedVideos = videoIds.map((id: string) => videosById.get(id)).filter(Boolean);

    return Promise.all(orderedVideos.map((item: any) => transformVideoItem(item, channelMap)));
  } catch (error) {
    console.error(`Error fetching recommended videos for video ID (${videoId}):`, error);
    return [];
  }
};


// This function will be used by the channel page.
export async function getChannelDetails(channelId: string): Promise<Channel | undefined> {
  if (!API_KEY) {
    console.error('YOUTUBE_API_KEY is not set. Returning undefined for getChannelDetails.');
    return undefined;
  }
  try {
    const channelMap = await fetchChannelData([channelId]);
    return channelMap.get(channelId);
  } catch (error) {
    console.error(`Error fetching channel details for ID (${channelId}):`, error);
    return undefined;
  }
}

// This function will be used by the channel page to get its videos.
export async function getChannelVideos(channelId: string, maxResults: number = 20): Promise<Video[]> {
   if (!API_KEY) {
    console.error('YOUTUBE_API_KEY is not set. Returning empty array for getChannelVideos.');
    return [];
  }
  try {
    const searchResponse = await fetch(
      `${API_BASE_URL}/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=date&type=video&key=${API_KEY}`
    );
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error(`YouTube API Error (getChannelVideos - search for channel ${channelId}):`, errorData.error?.message);
      return [];
    }
    const searchData = await searchResponse.json();
    if (!searchData.items || searchData.items.length === 0) return [];

    const videoIds = searchData.items.map((item: any) => item.id?.videoId).filter(Boolean);
    if (videoIds.length === 0) return [];

    const videosResponse = await fetch(
      `${API_BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${API_KEY}`
    );
     if (!videosResponse.ok) {
        const errorData = await videosResponse.json();
        console.error(`YouTube API Error (getChannelVideos - videos for channel ${channelId}):`, errorData.error?.message);
        // Fallback with partial data from search
        const channelMapForSearch = await fetchChannelData([channelId]); // only one channelId
        return Promise.all(searchData.items.map((item: any) => transformVideoItem(item, channelMapForSearch)));
    }
    const videosData = await videosResponse.json();
    if(!videosData.items) return [];

    const channelMap = await fetchChannelData([channelId]); // We only need this channel's data

    // Preserve order from search results (date order)
    const videosById = new Map(videosData.items.map((video: any) => [video.id, video]));
    const orderedVideos = videoIds.map((id: string) => videosById.get(id)).filter(Boolean);

    return Promise.all(orderedVideos.map((item: any) => transformVideoItem(item, channelMap)));
  } catch (error) {
    console.error(`Error fetching videos for channel ID (${channelId}):`, error);
    return [];
  }
}
