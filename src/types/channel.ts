export type Platform = "youtube" | "tiktok" | "instagram";

export interface Channel {
  name: string;
  handle: string;
  url: string;
  profile_image: string;
  total_subscribers: number;
  subscribers_gain: number;
  views_gain: number;
  likes_gain: number;
  platform: Platform;
}
