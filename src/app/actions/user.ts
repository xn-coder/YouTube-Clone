
'use server';

import { fetchChannelData } from '@/lib/data';
import type { Channel } from '@/types';

// Mock subscribed channel IDs. In a real app, these would come from user data in Firestore.
const MOCK_SUBSCRIBED_CHANNEL_IDS = [
  'UC_x5XG1OV2P6uZZ5FSM9Ttw', // Linus Tech Tips
  'UCBJycsmduvYEL83R_U4JriQ', // MKBHD
  'UCsT0YIqwnpJCM-mx7-gSA4Q', // MrWhoseTheBoss
  'UCO_RC-EuZVTkxm5e8ek1zvA', // Duke Dennis
  'UCFAiFyGs6oDiF1Nf-rRJpZA', // Technoblade
  'UChRlaISXbl2gECFAmDzxgzg', // Westen Champlin
  'UC4laAHbk8VSgmvB47tsd2XQ', // Eamon & Bec
];

export interface ChannelPreview {
  id: string;
  name: string;
  avatarUrl: string;
}

export async function getSubscribedChannelPreviews(): Promise<ChannelPreview[]> {
  if (MOCK_SUBSCRIBED_CHANNEL_IDS.length === 0) {
    return [];
  }

  try {
    // Note: fetchChannelData might return a Map with fewer items if some IDs are invalid or API fails for some.
    const channelMap = await fetchChannelData(MOCK_SUBSCRIBED_CHANNEL_IDS);
    
    const previews: ChannelPreview[] = [];
    // Iterate over MOCK_SUBSCRIBED_CHANNEL_IDS to maintain a somewhat predictable order
    // and handle cases where fetchChannelData might not return all requested IDs.
    for (const id of MOCK_SUBSCRIBED_CHANNEL_IDS) {
      const channel = channelMap.get(id);
      if (channel) {
        previews.push({
          id: channel.id,
          name: channel.name,
          avatarUrl: channel.avatarUrl,
        });
      }
    }
    return previews;
  } catch (error) {
    console.error("Error fetching subscribed channel previews:", error);
    return [];
  }
}
