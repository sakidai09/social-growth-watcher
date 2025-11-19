import type { Channel, Platform } from "@/types/channel";

const CHANNELS_PER_PLATFORM = 120;

type PlatformConfig = {
  platform: Platform;
  prefix: string;
  baseUrl: string;
  startSubscribers: number;
  subscriberStep: number;
  baseGains: {
    subscribers: number;
    views: number;
    likes: number;
  };
  profileImageBase: string;
};

const platformConfigs: PlatformConfig[] = [
  {
    platform: "youtube",
    prefix: "YouTubeフロンティア",
    baseUrl: "https://www.youtube.com/@sgw_youtube_",
    startSubscribers: 18000,
    subscriberStep: 520,
    baseGains: { subscribers: 13500, views: 620000, likes: 42000 },
    profileImageBase:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=60",
  },
  {
    platform: "tiktok",
    prefix: "TikTokライザー",
    baseUrl: "https://www.tiktok.com/@sgw_tiktok_",
    startSubscribers: 14000,
    subscriberStep: 470,
    baseGains: { subscribers: 11800, views: 720000, likes: 56000 },
    profileImageBase:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=100&q=60",
  },
  {
    platform: "instagram",
    prefix: "Instagramブロッサム",
    baseUrl: "https://www.instagram.com/sgw_instagram_",
    startSubscribers: 10000,
    subscriberStep: 430,
    baseGains: { subscribers: 9800, views: 310000, likes: 64000 },
    profileImageBase:
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=100&q=60",
  },
];

const momentumForIndex = (index: number) => {
  const decay = index / (CHANNELS_PER_PLATFORM * 1.2);
  return Math.max(0.32, 1 - decay);
};

const generateChannels = (config: PlatformConfig): Channel[] =>
  Array.from({ length: CHANNELS_PER_PLATFORM }, (_, index) => {
    const position = index + 1;
    const momentum = momentumForIndex(index);

    return {
      name: `${config.prefix}${String(position).padStart(3, "0")}`,
      url: `${config.baseUrl}${position}`,
      profile_image: `${config.profileImageBase}&sig=${config.platform}-${position}`,
      total_subscribers: Math.min(
        99000,
        Math.round(config.startSubscribers + index * config.subscriberStep)
      ),
      subscribers_gain: Math.max(
        400,
        Math.round(config.baseGains.subscribers * momentum)
      ),
      views_gain: Math.max(15000, Math.round(config.baseGains.views * momentum)),
      likes_gain: Math.max(800, Math.round(config.baseGains.likes * momentum)),
      platform: config.platform,
    } satisfies Channel;
  });

export const mockChannels: Channel[] = platformConfigs.flatMap(generateChannels);
