
'use server';

import type { Video, Channel, Playlist, PlaylistItem } from '@/types';
import { formatNumber, parseISO8601Duration, formatPublishedAt } from '@/lib/utils';
import { db } from '@/lib/firebase'; // Import Firestore db instance
import { doc, getDoc } from 'firebase/firestore';

const API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

interface PaginatedVideosResponse {
  videos: Video[];
  nextPageToken?: string;
  totalResults?: number;
}

interface PaginatedPlaylistsResponse {
  playlists: Playlist[];
  nextPageToken?: string;
  totalResults?: number;
}

// interface PaginatedPlaylistItemsResponse {
//   playlistItems: PlaylistItem[];
//   nextPageToken?: string;
//   totalResults?: number;
// }


export async function fetchChannelData(channelIds: string[]): Promise<Map<string, Channel>> {
  if (!API_KEY) {
    console.warn('YOUTUBE_API_KEY is not set. Channel data may be incomplete.');
    return new Map();
  }
  if (channelIds.length === 0) return new Map();

  try {
    const response = await fetch(
      `${API_BASE_URL}/channels?part=snippet,statistics,brandingSettings&id=${channelIds.join(',')}&key=${API_KEY}`
    );
    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API Error (fetchChannelData):', errorData.error?.message);
      return new Map();
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
  } catch (error) {
    console.error('Network or other error in fetchChannelData:', error);
    return new Map();
  }
}

async function transformVideoItem(item: any, channelMap: Map<string, Channel>): Promise<Video> {
  const channelId = item.snippet?.channelId;
  let channel = channelMap.get(channelId);

  if (!channel && channelId && API_KEY) {
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
      avatarUrl: `https://placehold.co/40x40.png`,
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

function transformPlaylistItemAPI(item: any): Playlist {
  return {
    id: item.id,
    title: item.snippet?.title || 'Untitled Playlist',
    description: item.snippet?.description,
    thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || 'https://placehold.co/320x180.png',
    channelId: item.snippet?.channelId,
    channelTitle: item.snippet?.channelTitle || 'Unknown Channel',
    videoCount: item.contentDetails?.itemCount || 0,
    publishedAt: item.snippet?.publishedAt, // ISO date string
  };
}


export const getVideos = async (maxResults: number = 20, pageToken?: string): Promise<PaginatedVideosResponse> => {
  if (!API_KEY) {
    console.error('YOUTUBE_API_KEY is not set. Returning empty for getVideos.');
    return { videos: [], nextPageToken: undefined, totalResults: 0 };
  }
  try {
    let url = `${API_BASE_URL}/videos?part=snippet,contentDetails,statistics&chart=mostPopular&regionCode=US&maxResults=${maxResults}&key=${API_KEY}`;
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API Error (getVideos):', errorData.error?.message);
      return { videos: [], nextPageToken: undefined, totalResults: 0 };
    }
    const data = await response.json();
    if (!data.items) return { videos: [], nextPageToken: data.nextPageToken, totalResults: data.pageInfo?.totalResults || 0 };

    const channelIds = [...new Set(data.items.map((item: any) => item.snippet?.channelId).filter(Boolean))];
    const channelMap = await fetchChannelData(channelIds);

    const videos = await Promise.all(data.items.map((item: any) => transformVideoItem(item, channelMap)));
    return { videos, nextPageToken: data.nextPageToken, totalResults: data.pageInfo?.totalResults };

  } catch (error) {
    console.error('Error fetching popular videos:', error);
    return { videos: [], nextPageToken: undefined, totalResults: 0 };
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
      `${API_BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${encodeURIComponent(trimmedId)}&key=${API_KEY}`
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


export const searchVideos = async (query: string, maxResults: number = 20, pageToken?: string): Promise<PaginatedVideosResponse> => {
  const trimmedQuery = query?.trim();
  if (!API_KEY) {
    console.error('YOUTUBE_API_KEY is not set. Returning empty for searchVideos.');
    return { videos: [], nextPageToken: undefined, totalResults: 0 };
  }
  if (!trimmedQuery) return getVideos(maxResults, pageToken);

  try {
    let searchUrl = `${API_BASE_URL}/search?part=snippet&q=${encodeURIComponent(trimmedQuery)}&maxResults=${maxResults}&type=video&key=${API_KEY}`;
    if (pageToken) {
      searchUrl += `&pageToken=${pageToken}`;
    }
    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error(`YouTube API Error (searchVideos - search for query "${trimmedQuery}"):`, errorData.error?.message);
      return { videos: [], nextPageToken: undefined, totalResults: 0 };
    }
    const searchData = await searchResponse.json();
    if (!searchData.items || searchData.items.length === 0) {
      return { videos: [], nextPageToken: searchData.nextPageToken, totalResults: searchData.pageInfo?.totalResults || 0 };
    }

    const videoIds = searchData.items.map((item: any) => item.id?.videoId).filter(Boolean);
    if (videoIds.length === 0) {
      return { videos: [], nextPageToken: searchData.nextPageToken, totalResults: searchData.pageInfo?.totalResults || 0 };
    }

    const videosResponse = await fetch(
      `${API_BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${API_KEY}`
    );
    if (!videosResponse.ok) {
      const errorData = await videosResponse.json();
      console.error(`YouTube API Error (searchVideos - videos for query "${trimmedQuery}"):`, errorData.error?.message);
      const channelIdsFromSearch = [...new Set(searchData.items.map((item: any) => item.snippet?.channelId).filter(Boolean))];
      const channelMapFromSearch = await fetchChannelData(channelIdsFromSearch);
      const fallbackVideos = await Promise.all(searchData.items.map((item: any) => transformVideoItem(item, channelMapFromSearch)));
      return { videos: fallbackVideos, nextPageToken: searchData.nextPageToken, totalResults: searchData.pageInfo?.totalResults };
    }
    const videosData = await videosResponse.json();
    if (!videosData.items) {
      return { videos: [], nextPageToken: searchData.nextPageToken, totalResults: searchData.pageInfo?.totalResults };
    }

    const channelIds = [...new Set(videosData.items.map((item: any) => item.snippet?.channelId).filter(Boolean))];
    const channelMap = await fetchChannelData(channelIds);

    const videosById = new Map(videosData.items.map((video: any) => [video.id, video]));
    const orderedVideoItems = videoIds.map((id: string) => videosById.get(id)).filter(Boolean);

    const videos = await Promise.all(orderedVideoItems.map((item: any) => transformVideoItem(item, channelMap)));
    return { videos, nextPageToken: searchData.nextPageToken, totalResults: searchData.pageInfo?.totalResults };

  } catch (error) {
    console.error(`Error searching videos for query "${trimmedQuery}":`, error);
    return { videos: [], nextPageToken: undefined, totalResults: 0 };
  }
};

export const getSubscribedVideos = async (userId: string, maxTotalResults: number = 20, pageToken?: string): Promise<PaginatedVideosResponse> => {
  if (!API_KEY) {
    console.error('YOUTUBE_API_KEY is not set. Returning empty for getSubscribedVideos.');
    return { videos: [], nextPageToken: undefined, totalResults: 0 };
  }
  if (!userId) {
    console.warn('getSubscribedVideos called without userId. Returning empty.');
    return { videos: [], nextPageToken: undefined, totalResults: 0 };
  }

  let subscribedChannelIds: string[] = [];
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      subscribedChannelIds = userDocSnap.data().subscribedChannelIds || [];
    } else {
      console.log(`No user document found for userId: ${userId} in getSubscribedVideos.`);
      return { videos: [], nextPageToken: undefined, totalResults: 0 };
    }
  } catch (error) {
    console.error("Error fetching user's subscribed channel IDs from Firestore:", error);
    return { videos: [], nextPageToken: undefined, totalResults: 0 };
  }

  if (subscribedChannelIds.length === 0) {
    return { videos: [], nextPageToken: undefined, totalResults: 0 };
  }

  if (pageToken) {
    console.warn("getSubscribedVideos: pageToken is present, returning empty to avoid re-fetching initial set in this simplified model.");
    return { videos: [], nextPageToken: undefined, totalResults: 0 };
  }

  try {
    let allSubscribedVideos: Video[] = [];
    const maxResultsPerChannel = Math.max(5, Math.ceil(maxTotalResults / subscribedChannelIds.length));

    const channelMap = await fetchChannelData(subscribedChannelIds);

    for (const channelId of subscribedChannelIds) {
      const response = await fetch(
        `${API_BASE_URL}/search?part=snippet&channelId=${encodeURIComponent(channelId)}&maxResults=${maxResultsPerChannel}&order=date&type=video&key=${API_KEY}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.items) {
          const videoIds = data.items.map((item: any) => item.id?.videoId).filter(Boolean);
          if (videoIds.length > 0) {
            const videosDetailsResponse = await fetch(
              `${API_BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${API_KEY}`
            );
            if (videosDetailsResponse.ok) {
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
    const finalVideos = allSubscribedVideos.slice(0, maxTotalResults);

    return { videos: finalVideos, nextPageToken: undefined, totalResults: finalVideos.length };
  } catch (error) {
    console.error('Error fetching subscribed videos:', error);
    return { videos: [], nextPageToken: undefined, totalResults: 0 };
  }
};

export const getRecommendedVideos = async (videoId: string, maxResults: number = 10, pageToken?: string): Promise<PaginatedVideosResponse> => {
  const trimmedVideoId = videoId?.trim();
  if (!API_KEY) {
    console.error('YOUTUBE_API_KEY is not set. Returning empty for getRecommendedVideos.');
    return { videos: [], nextPageToken: undefined, totalResults: 0 };
  }
  if (!trimmedVideoId) {
    console.warn('getRecommendedVideos called with empty or whitespace videoId. Returning empty.');
    return { videos: [], nextPageToken: undefined, totalResults: 0 };
  }
  try {
    let searchUrl = `${API_BASE_URL}/search?part=snippet&relatedToVideoId=${encodeURIComponent(trimmedVideoId)}&type=video&maxResults=${maxResults}&key=${API_KEY}`;
    if (pageToken) {
      searchUrl += `&pageToken=${encodeURIComponent(pageToken)}`;
    }
    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      let detailedMessage = errorData.error?.message || 'Unknown API error';
      if (errorData.error?.errors && Array.isArray(errorData.error.errors) && errorData.error.errors.length > 0) {
        detailedMessage += ' Details: ' + errorData.error.errors.map((e: any) => `(${e.reason}) ${e.message}`).join(', ');
      }
      console.error(`YouTube API Error (getRecommendedVideos - search for videoId: ${trimmedVideoId}): ${detailedMessage}`);
      return { videos: [], nextPageToken: undefined, totalResults: 0 };
    }
    const searchData = await searchResponse.json();
    if (!searchData.items || searchData.items.length === 0) {
      return { videos: [], nextPageToken: searchData.nextPageToken, totalResults: searchData.pageInfo?.totalResults || 0 };
    }

    const videoIds = searchData.items.map((item: any) => item.id?.videoId).filter(Boolean);
    if (videoIds.length === 0) {
      return { videos: [], nextPageToken: searchData.nextPageToken, totalResults: searchData.pageInfo?.totalResults || 0 };
    }

    const videosResponse = await fetch(
      `${API_BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${API_KEY}`
    );
    if (!videosResponse.ok) {
      const errorData = await videosResponse.json();
      console.error(`YouTube API Error (getRecommendedVideos - videos for relatedToVideoId: ${trimmedVideoId}):`, errorData.error?.message);
      const channelIdsFromSearch = [...new Set(searchData.items.map((item: any) => item.snippet?.channelId).filter(Boolean))];
      const channelMapFromSearch = await fetchChannelData(channelIdsFromSearch);
      const fallbackVideos = await Promise.all(searchData.items.map((item: any) => transformVideoItem(item, channelMapFromSearch)));
      return { videos: fallbackVideos, nextPageToken: searchData.nextPageToken, totalResults: searchData.pageInfo?.totalResults };
    }
    const videosData = await videosResponse.json();
    if (!videosData.items) {
      return { videos: [], nextPageToken: searchData.nextPageToken, totalResults: searchData.pageInfo?.totalResults };
    }

    const channelIds = [...new Set(videosData.items.map((item: any) => item.snippet?.channelId).filter(Boolean))];
    const channelMap = await fetchChannelData(channelIds);

    const videosById = new Map(videosData.items.map((video: any) => [video.id, video]));
    const orderedVideoItems = videoIds.map((id: string) => videosById.get(id)).filter(Boolean);

    const videos = await Promise.all(orderedVideoItems.map((item: any) => transformVideoItem(item, channelMap)));
    return { videos, nextPageToken: searchData.nextPageToken, totalResults: searchData.pageInfo?.totalResults };

  } catch (error) {
    console.error(`Error fetching recommended videos for video ID (${trimmedVideoId}):`, error);
    return { videos: [], nextPageToken: undefined, totalResults: 0 };
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

export async function getChannelVideos(channelId: string, maxResults: number = 20, pageToken?: string): Promise<PaginatedVideosResponse> {
  const trimmedChannelId = channelId?.trim();
  if (!API_KEY) {
    console.error('YOUTUBE_API_KEY is not set. Returning empty for getChannelVideos.');
    return { videos: [], nextPageToken: undefined, totalResults: 0 };
  }
  if (!trimmedChannelId) {
    console.warn('getChannelVideos called with empty or whitespace channelId. Returning empty.');
    return { videos: [], nextPageToken: undefined, totalResults: 0 };
  }
  try {
    let searchUrl = `${API_BASE_URL}/search?part=snippet&channelId=${encodeURIComponent(trimmedChannelId)}&maxResults=${maxResults}&order=date&type=video&key=${API_KEY}`;
    if (pageToken) {
      searchUrl += `&pageToken=${encodeURIComponent(pageToken)}`;
    }
    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error(`YouTube API Error (getChannelVideos - search for channel ${trimmedChannelId}):`, errorData.error?.message);
      return { videos: [], nextPageToken: undefined, totalResults: 0 };
    }
    const searchData = await searchResponse.json();
    if (!searchData.items || searchData.items.length === 0) {
      return { videos: [], nextPageToken: searchData.nextPageToken, totalResults: searchData.pageInfo?.totalResults || 0 };
    }

    const videoIds = searchData.items.map((item: any) => item.id?.videoId).filter(Boolean);
    if (videoIds.length === 0) {
      return { videos: [], nextPageToken: searchData.nextPageToken, totalResults: searchData.pageInfo?.totalResults || 0 };
    }

    const videosResponse = await fetch(
      `${API_BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${API_KEY}`
    );
    if (!videosResponse.ok) {
      const errorData = await videosResponse.json();
      console.error(`YouTube API Error (getChannelVideos - videos for channel ${trimmedChannelId}):`, errorData.error?.message);
      const channelMapForSearch = await fetchChannelData([trimmedChannelId]);
      const fallbackVideos = await Promise.all(searchData.items.map((item: any) => transformVideoItem(item, channelMapForSearch)));
      return { videos: fallbackVideos, nextPageToken: searchData.nextPageToken, totalResults: searchData.pageInfo?.totalResults };
    }
    const videosData = await videosResponse.json();
    if (!videosData.items) {
      return { videos: [], nextPageToken: searchData.nextPageToken, totalResults: searchData.pageInfo?.totalResults };
    }

    const channelMap = await fetchChannelData([trimmedChannelId]);

    const videosById = new Map(videosData.items.map((video: any) => [video.id, video]));
    const orderedVideoItems = videoIds.map((id: string) => videosById.get(id)).filter(Boolean);

    const videos = await Promise.all(orderedVideoItems.map((item: any) => transformVideoItem(item, channelMap)));
    return { videos, nextPageToken: searchData.nextPageToken, totalResults: searchData.pageInfo?.totalResults };

  } catch (error) {
    console.error(`Error fetching videos for channel ID (${trimmedChannelId}):`, error);
    return { videos: [], nextPageToken: undefined, totalResults: 0 };
  }
}


export async function getChannelPlaylists(channelId: string, maxResults: number = 10, pageToken?: string): Promise<PaginatedPlaylistsResponse> {
  const trimmedChannelId = channelId?.trim();
  if (!API_KEY) {
    console.error('YOUTUBE_API_KEY is not set. Returning empty for getChannelPlaylists.');
    return { playlists: [], nextPageToken: undefined, totalResults: 0 };
  }
  if (!trimmedChannelId) {
    console.warn('getChannelPlaylists called with empty or whitespace channelId. Returning empty.');
    return { playlists: [], nextPageToken: undefined, totalResults: 0 };
  }

  try {
    let url = `${API_BASE_URL}/playlists?part=snippet,contentDetails&channelId=${encodeURIComponent(trimmedChannelId)}&maxResults=${maxResults}&key=${API_KEY}`;
    if (pageToken) {
      url += `&pageToken=${encodeURIComponent(pageToken)}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`YouTube API Error (getChannelPlaylists for channel ${trimmedChannelId}):`, errorData.error?.message);
      return { playlists: [], nextPageToken: undefined, totalResults: 0 };
    }
    const data = await response.json();
    if (!data.items) {
      return { playlists: [], nextPageToken: data.nextPageToken, totalResults: data.pageInfo?.totalResults || 0 };
    }

    const playlists: Playlist[] = data.items.map(transformPlaylistItemAPI);
    
    return { playlists, nextPageToken: data.nextPageToken, totalResults: data.pageInfo?.totalResults };
  } catch (error) {
    console.error(`Error fetching playlists for channel ID (${trimmedChannelId}):`, error);
    return { playlists: [], nextPageToken: undefined, totalResults: 0 };
  }
}

// Placeholder for fetching items within a playlist
// export async function getPlaylistItems(playlistId: string, maxResults: number = 20, pageToken?: string): Promise<PaginatedPlaylistItemsResponse> {
//   // Implementation would be similar to getChannelVideos but using playlistItems endpoint
//   return { playlistItems: [], nextPageToken: undefined, totalResults: 0 };
// }
