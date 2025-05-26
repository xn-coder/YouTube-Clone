
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
  const trimmedId = id?.trim();
  if (!API_KEY) {
    console.error('YOUTUBE_API_KEY is not set. Returning undefined for getVideoById.');
    return undefined;
  }
  if (!trimmedId) {
      console.warn('getVideoById called with empty or whitespace ID. Returning undefined.');
      return undefined;
  }
  try {
    const response = await fetch(
      `${API_BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${trimmedId}&key=${API_KEY}`
    );
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`YouTube API Error (getVideoById for ID: ${trimmedId}):`, errorData.error?.message);
      return undefined;
    }
    const data = await response.json();
    if (!data.items || data.items.length === 0) return undefined;

    return transformVideoItem(data.items[0], new Map());
  } catch (error) {
    console.error(`Error fetching video by ID (${trimmedId}):`, error);
    return undefined;
  }
};

export const getCommentsByVideoId = async (videoId: string, maxResults: number = 20): Promise<Comment[]> => {
  const trimmedVideoId = videoId?.trim();
  if (!API_KEY) {
    console.error('YOUTUBE_API_KEY is not set. Returning empty array for getCommentsByVideoId.');
    return [];
  }
  if (!trimmedVideoId) {
    console.warn('getCommentsByVideoId called with empty or whitespace videoId. Returning empty array.');
    return [];
  }
  try {
    const response = await fetch(
      `${API_BASE_URL}/commentThreads?part=snippet,replies&videoId=${trimmedVideoId}&maxResults=${maxResults}&textFormat=html&key=${API_KEY}`
    );
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`YouTube API Error (getCommentsByVideoId for videoId: ${trimmedVideoId}):`, errorData.error?.message);
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
        text: topLevelComment?.textDisplay || '', 
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
    console.error(`Error fetching comments for video ID (${trimmedVideoId}):`, error);
    return [];
  }
};

export const searchVideos = async (query: string, maxResults: number = 20): Promise<Video[]> => {
  const trimmedQuery = query?.trim();
  if (!API_KEY) {
    console.error('YOUTUBE_API_KEY is not set. Returning empty array for searchVideos.');
    return [];
  }
  if (!trimmedQuery) return getVideos(maxResults); 
  
  try {
    const searchResponse = await fetch(
      `${API_BASE_URL}/search?part=snippet&q=${encodeURIComponent(trimmedQuery)}&maxResults=${maxResults}&type=video&key=${API_KEY}`
    );
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error(`YouTube API Error (searchVideos - search for query "${trimmedQuery}"):`, errorData.error?.message);
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
      console.error(`YouTube API Error (searchVideos - videos for query "${trimmedQuery}"):`, errorData.error?.message);
      const channelIdsFromSearch = [...new Set(searchData.items.map((item: any) => item.snippet?.channelId).filter(Boolean))];
      const channelMapFromSearch = await fetchChannelData(channelIdsFromSearch);
      return Promise.all(searchData.items.map((item: any) => transformVideoItem(item, channelMapFromSearch)));
    }
    const videosData = await videosResponse.json();
    if (!videosData.items) return [];
    
    const channelIds = [...new Set(videosData.items.map((item: any) => item.snippet?.channelId).filter(Boolean))];
    const channelMap = await fetchChannelData(channelIds);

    const videosById = new Map(videosData.items.map((video: any) => [video.id, video]));
    const orderedVideos = videoIds.map((id: string) => videosById.get(id)).filter(Boolean);

    return Promise.all(orderedVideos.map((item: any) => transformVideoItem(item, channelMap)));
  } catch (error) {
    console.error(`Error searching videos for query "${trimmedQuery}":`, error);
    return [];
  }
};

const SUBSCRIBED_CHANNEL_IDS = [
  'UC_x5XG1OV2P6uZZ5FSM9Ttw', 
  'UCBJycsmduvYEL83R_U4JriQ', 
  'UCsT0YIqwnpJCM-mx7-gSA4Q', 
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
    allSubscribedVideos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    return allSubscribedVideos.slice(0, 20);
  } catch (error) {
    console.error('Error fetching subscribed videos:', error);
    return [];
  }
};

export const getRecommendedVideos = async (videoId: string, maxResults: number = 10): Promise<Video[]> => {
  const trimmedVideoId = videoId?.trim();
  if (!API_KEY) {
    console.error('YOUTUBE_API_KEY is not set. Returning empty array for getRecommendedVideos.');
    return [];
  }
  if (!trimmedVideoId) {
    console.warn('getRecommendedVideos called with empty or whitespace videoId. Returning empty array.');
    return [];
  }
  try {
    const searchResponse = await fetch(
      `${API_BASE_URL}/search?part=snippet&relatedToVideoId=${trimmedVideoId}&type=video&maxResults=${maxResults}&key=${API_KEY}`
    );
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      let detailedMessage = errorData.error?.message || 'Unknown API error';
      if (errorData.error?.errors && Array.isArray(errorData.error.errors) && errorData.error.errors.length > 0) {
        detailedMessage += ' Details: ' + errorData.error.errors.map((e: any) => `(${e.reason}) ${e.message}`).join(', ');
      }
      console.error(`YouTube API Error (getRecommendedVideos - search for videoId: ${trimmedVideoId}): ${detailedMessage}`);
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
        console.error(`YouTube API Error (getRecommendedVideos - videos for relatedToVideoId: ${trimmedVideoId}):`, errorData.error?.message);
        const channelIdsFromSearch = [...new Set(searchData.items.map((item: any) => item.snippet?.channelId).filter(Boolean))];
        const channelMapFromSearch = await fetchChannelData(channelIdsFromSearch);
        return Promise.all(searchData.items.map((item: any) => transformVideoItem(item, channelMapFromSearch)));
    }
    const videosData = await videosResponse.json();
     if (!videosData.items) return [];

    const channelIds = [...new Set(videosData.items.map((item: any) => item.snippet?.channelId).filter(Boolean))];
    const channelMap = await fetchChannelData(channelIds);
    
    const videosById = new Map(videosData.items.map((video: any) => [video.id, video]));
    const orderedVideos = videoIds.map((id: string) => videosById.get(id)).filter(Boolean);

    return Promise.all(orderedVideos.map((item: any) => transformVideoItem(item, channelMap)));
  } catch (error) {
    console.error(`Error fetching recommended videos for video ID (${trimmedVideoId}):`, error);
    return [];
  }
};

export async function getChannelDetails(channelId: string): Promise<Channel | undefined> {
  const trimmedChannelId = channelId?.trim();
  if (!API_KEY) {
    console.error('YOUTUBE_API_KEY is not set. Returning undefined for getChannelDetails.');
    return undefined;
  }
  if (!trimmedChannelId) {
    console.warn('getChannelDetails called with empty or whitespace channelId. Returning undefined.');
    return undefined;
  }
  try {
    const channelMap = await fetchChannelData([trimmedChannelId]);
    return channelMap.get(trimmedChannelId);
  } catch (error) {
    console.error(`Error fetching channel details for ID (${trimmedChannelId}):`, error);
    return undefined;
  }
}

export async function getChannelVideos(channelId: string, maxResults: number = 20): Promise<Video[]> {
   const trimmedChannelId = channelId?.trim();
   if (!API_KEY) {
    console.error('YOUTUBE_API_KEY is not set. Returning empty array for getChannelVideos.');
    return [];
  }
  if (!trimmedChannelId) {
    console.warn('getChannelVideos called with empty or whitespace channelId. Returning empty array.');
    return [];
  }
  try {
    const searchResponse = await fetch(
      `${API_BASE_URL}/search?part=snippet&channelId=${trimmedChannelId}&maxResults=${maxResults}&order=date&type=video&key=${API_KEY}`
    );
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error(`YouTube API Error (getChannelVideos - search for channel ${trimmedChannelId}):`, errorData.error?.message);
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
        console.error(`YouTube API Error (getChannelVideos - videos for channel ${trimmedChannelId}):`, errorData.error?.message);
        const channelMapForSearch = await fetchChannelData([trimmedChannelId]); 
        return Promise.all(searchData.items.map((item: any) => transformVideoItem(item, channelMapForSearch)));
    }
    const videosData = await videosResponse.json();
    if(!videosData.items) return [];

    const channelMap = await fetchChannelData([trimmedChannelId]); 

    const videosById = new Map(videosData.items.map((video: any) => [video.id, video]));
    const orderedVideos = videoIds.map((id: string) => videosById.get(id)).filter(Boolean);

    return Promise.all(orderedVideos.map((item: any) => transformVideoItem(item, channelMap)));
  } catch (error) {
    console.error(`Error fetching videos for channel ID (${trimmedChannelId}):`, error);
    return [];
  }
}
