import { NextResponse } from "next/server";
import { mockChannels } from "@/data/mockChannels";
import type { Channel } from "@/types/channel";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform");
  const period = searchParams.get("period") ?? "1m";
  const metric = searchParams.get("metric") ?? "subscribers";

  const multiplier = periodMultiplier[period] ?? 1;
  const key = metricKey[metric] ?? "subscribers_gain";

  const channels = mockChannels
    .filter((channel) =>
      platform && platform !== "all" ? channel.platform === platform : true
    )
    .map((channel) => ({
      ...channel,
      subscribers_gain: Math.round(channel.subscribers_gain * multiplier),
      views_gain: Math.round(channel.views_gain * multiplier),
      likes_gain: Math.round(channel.likes_gain * multiplier),
    }))
    .filter((channel) => channel.total_subscribers <= 100000)
    .sort((a, b) => {
      const valueA = a[key];
      const valueB = b[key];
      return typeof valueB === "number" && typeof valueA === "number"
        ? valueB - valueA
        : 0;
    });

  return NextResponse.json({ channels });
}
