import { NextResponse } from "next/server";
import { mockChannels } from "@/data/mockChannels";
import type { Channel, Platform } from "@/types/channel";
import { resolveChannelMetadata } from "@/lib/channelUrls";

const periodMultiplier: Record<string, number> = {
  "1m": 1,
  "2w": 0.65,
  "1w": 0.4,
};

const metricKey: Record<string, keyof Channel> = {
  subscribers: "subscribers_gain",
  views: "views_gain",
  likes: "likes_gain",
};

const SUPPORTED_PLATFORMS: Platform[] = ["youtube", "tiktok", "instagram"];
const MAX_CHANNELS_PER_PLATFORM = 100;

const scaleByPeriod = (channel: Channel, multiplier: number): Channel => ({
  ...channel,
  subscribers_gain: Math.round(channel.subscribers_gain * multiplier),
  views_gain: Math.round(channel.views_gain * multiplier),
  likes_gain: Math.round(channel.likes_gain * multiplier),
});

const sortByMetric = (key: keyof Channel) => (a: Channel, b: Channel) => {
  const valueA = a[key];
  const valueB = b[key];
  if (typeof valueA === "number" && typeof valueB === "number") {
    return valueB - valueA;
  }
  return String(valueB).localeCompare(String(valueA));
};

const topChannelsForPlatform = (
  platform: Platform,
  multiplier: number,
  key: keyof Channel
) =>
  mockChannels
    .filter((channel) => channel.platform === platform)
    .map((channel) => scaleByPeriod(channel, multiplier))
    .filter((channel) => channel.total_subscribers <= 100000)
    .sort(sortByMetric(key))
    .slice(0, MAX_CHANNELS_PER_PLATFORM);

const isPlatform = (value: string): value is Platform =>
  SUPPORTED_PLATFORMS.includes(value as Platform);

const attachMetadata = async (channels: Channel[]) =>
  Promise.all(
    channels.map(async (channel) => {
      try {
        const metadata = await resolveChannelMetadata(
          channel.platform,
          channel.handle,
          channel.url,
          channel.profile_image
        );
        return {
          ...channel,
          url: metadata.url,
          profile_image: metadata.profileImage,
        };
      } catch (error) {
        console.error(
          `[URL Resolver] ${channel.platform}:${channel.handle} 取得中にエラー`,
          error
        );
        return channel;
      }
    })
  );

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform");
  const period = searchParams.get("period") ?? "1m";
  const metric = searchParams.get("metric") ?? "subscribers";

  const multiplier = periodMultiplier[period] ?? 1;
  const key = metricKey[metric] ?? "subscribers_gain";

  let channels: Channel[] = [];

  if (platform && platform !== "all") {
    if (!isPlatform(platform)) {
      return NextResponse.json({ channels: [] });
    }
    channels = topChannelsForPlatform(platform, multiplier, key);
  } else {
    const combined = SUPPORTED_PLATFORMS.flatMap((platformName) =>
      topChannelsForPlatform(platformName, multiplier, key)
    );
    channels = combined.sort(sortByMetric(key)).slice(0, MAX_CHANNELS_PER_PLATFORM);
  }

  const enrichedChannels = await attachMetadata(channels);
  return NextResponse.json({ channels: enrichedChannels });
}
