import type { Channel, Platform } from "@/types/channel";
import { defaultProfileBuilders, defaultUrlBuilders } from "@/lib/channelUrls";

const CHANNELS_PER_PLATFORM = 120;

type PlatformConfig = {
  platform: Platform;
  prefix: string;
  handlePrefix: string;
  handles?: string[];
  startSubscribers: number;
  subscriberStep: number;
  baseGains: {
    subscribers: number;
    views: number;
    likes: number;
  };
};

const platformConfigs: PlatformConfig[] = [
  {
    platform: "youtube",
    prefix: "YouTubeフロンティア",
    handlePrefix: "sgw_youtube_",
    handles: [
      "Google",
      "YouTubeJapan",
      "GoogleDevelopers",
      "Android",
      "ChromeDevelopers",
      "veritasium",
      "kurzgesagt",
      "MarquesBrownlee",
      "LinusTechTips",
      "TED",
      "nasajpl",
      "WIRED",
      "KurzgesagtInANutshell",
      "netflix",
      "Numberphile",
      "CGPGrey",
      "MrBeast",
      "PewDiePie",
      "CrashCourse",
      "NatGeo",
    ],
    startSubscribers: 18000,
    subscriberStep: 520,
    baseGains: { subscribers: 13500, views: 620000, likes: 42000 },
  },
  {
    platform: "tiktok",
    prefix: "TikTokライザー",
    handlePrefix: "sgw_tiktok_",
    handles: [
      "tiktok",
      "nba",
      "mlb",
      "netflix",
      "espn",
      "willsmith",
      "selenagomez",
      "therock",
      "marshmello",
      "justinbieber",
      "shakira",
      "arianagrande",
      "bts_official_bighit",
      "jlo",
      "billieeilish",
      "dualipa",
      "kyliejenner",
      "kimberlyloayza",
      "charlidamelio",
      "khaby.lame",
    ],
    startSubscribers: 14000,
    subscriberStep: 470,
    baseGains: { subscribers: 11800, views: 720000, likes: 56000 },
  },
  {
    platform: "instagram",
    prefix: "Instagramブロッサム",
    handlePrefix: "sgw_instagram_",
    handles: [
      "instagram",
      "natgeo",
      "nasa",
      "cristiano",
      "leomessi",
      "selenagomez",
      "kimkardashian",
      "beyonce",
      "justinbieber",
      "nike",
      "virat.kohli",
      "therock",
      "kyliejenner",
      "zendaya",
      "champagnepapi",
      "dualipa",
      "jlo",
      "ladygaga",
      "bts.bighitofficial",
      "badgalriri",
    ],
    startSubscribers: 10000,
    subscriberStep: 430,
    baseGains: { subscribers: 9800, views: 310000, likes: 64000 },
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
    const handle =
      config.handles?.[index % config.handles.length] ??
      `${config.handlePrefix}${position}`;

    return {
      name: `${config.prefix}${String(position).padStart(3, "0")}`,
      handle,
      url: defaultUrlBuilders[config.platform](handle),
      profile_image: defaultProfileBuilders[config.platform](handle),
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
