import type { Platform } from "@/types/channel";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

const defaultUrlBuilders: Record<Platform, (handle: string) => string> = {
  youtube: (handle) => `https://www.youtube.com/@${handle}`,
  tiktok: (handle) => `https://www.tiktok.com/@${handle}`,
  instagram: (handle) => `https://www.instagram.com/${handle}/`,
};

const scrapeTargets: Record<Platform, (handle: string) => string> = {
  youtube: (handle) => defaultUrlBuilders.youtube(handle),
  tiktok: (handle) => defaultUrlBuilders.tiktok(handle),
  instagram: (handle) => defaultUrlBuilders.instagram(handle),
};

const urlCache = new Map<string, string>();

const canonicalFromHtml = (html: string) => {
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  if (canonicalMatch?.[1]) {
    return canonicalMatch[1];
  }
  const ogMatch = html.match(/property=["']og:url["'][^>]+content=["']([^"']+)["']/i);
  if (ogMatch?.[1]) {
    return ogMatch[1];
  }
  return null;
};

const scrapeCanonicalUrl = async (
  platform: Platform,
  handle: string
): Promise<string | null> => {
  const target = scrapeTargets[platform](handle);
  try {
    const response = await fetch(target, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const html = await response.text();
    const canonical = canonicalFromHtml(html);
    if (canonical) {
      console.info(
        `[URL Resolver] ${platform}:${handle} スクレイピングで取得成功 -> ${canonical}`
      );
      return canonical;
    }
    console.warn(
      `[URL Resolver] ${platform}:${handle} スクレイピングでcanonical取得できず`
    );
    return null;
  } catch (error) {
    console.warn(
      `[URL Resolver] ${platform}:${handle} スクレイピング失敗: ${(error as Error).message}`
    );
    return null;
  }
};

const fetchYoutubeUrlFromApi = async (handle: string) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY が設定されていません");
  }
  const searchUrl =
    "https://www.googleapis.com/youtube/v3/search?" +
    new URLSearchParams({
      part: "snippet",
      type: "channel",
      q: handle,
      maxResults: "1",
      key: apiKey,
    }).toString();
  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) {
    throw new Error(`YouTube search API error ${searchResponse.status}`);
  }
  const searchData = await searchResponse.json();
  const channelId =
    searchData?.items?.[0]?.id?.channelId || searchData?.items?.[0]?.snippet?.channelId;
  if (!channelId) {
    throw new Error("YouTubeチャンネルが見つかりませんでした");
  }
  const channelUrl =
    "https://www.googleapis.com/youtube/v3/channels?" +
    new URLSearchParams({
      part: "snippet",
      id: channelId,
      key: apiKey,
    }).toString();
  const channelResponse = await fetch(channelUrl);
  if (!channelResponse.ok) {
    throw new Error(`YouTube channels API error ${channelResponse.status}`);
  }
  const channelData = await channelResponse.json();
  const customUrl = channelData?.items?.[0]?.snippet?.customUrl;
  if (customUrl) {
    return customUrl.startsWith("@")
      ? `https://www.youtube.com/${customUrl}`
      : `https://www.youtube.com/@${customUrl}`;
  }
  return `https://www.youtube.com/channel/${channelId}`;
};

const fetchTikTokUrlFromApi = async (handle: string) => {
  const apiKey = process.env.TIKTOK_API_KEY;
  const apiHost = process.env.TIKTOK_API_HOST;
  const endpoint = process.env.TIKTOK_API_ENDPOINT;
  if (!apiKey || !apiHost) {
    throw new Error("TikTok API設定が不足しています");
  }
  const url =
    (endpoint ?? `https://${apiHost}/user/info`) +
    (endpoint?.includes("?") ? "&" : "?") +
    new URLSearchParams({ unique_id: handle }).toString();
  const response = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": apiHost,
    },
  });
  if (!response.ok) {
    throw new Error(`TikTok API error ${response.status}`);
  }
  const data = await response.json();
  const username = data?.data?.user?.uniqueId || data?.user?.uniqueId || handle;
  return `https://www.tiktok.com/@${username}`;
};

const fetchInstagramUrlFromApi = async (handle: string) => {
  const token = process.env.INSTAGRAM_GRAPH_API_TOKEN;
  if (!token) {
    throw new Error("INSTAGRAM_GRAPH_API_TOKEN が設定されていません");
  }
  const profileUrl = `https://www.instagram.com/${handle}/`;
  const oEmbedUrl =
    "https://graph.facebook.com/v17.0/instagram_oembed?" +
    new URLSearchParams({ url: profileUrl, access_token: token }).toString();
  const response = await fetch(oEmbedUrl);
  if (!response.ok) {
    throw new Error(`Instagram oEmbed API error ${response.status}`);
  }
  const data = await response.json();
  return data?.author_url || profileUrl;
};

const fetchChannelUrlFromApi = async (platform: Platform, handle: string) => {
  switch (platform) {
    case "youtube":
      return fetchYoutubeUrlFromApi(handle);
    case "tiktok":
      return fetchTikTokUrlFromApi(handle);
    case "instagram":
      return fetchInstagramUrlFromApi(handle);
    default:
      return null;
  }
};

export const resolveChannelUrl = async (
  platform: Platform,
  handle: string,
  fallback?: string
) => {
  const cacheKey = `${platform}:${handle}`;
  if (urlCache.has(cacheKey)) {
    return urlCache.get(cacheKey)!;
  }
  const normalizedHandle = handle.replace(/^@/, "").trim();
  const defaultUrl = fallback ?? defaultUrlBuilders[platform](normalizedHandle);
  const scraped = await scrapeCanonicalUrl(platform, normalizedHandle);
  if (scraped) {
    urlCache.set(cacheKey, scraped);
    return scraped;
  }
  console.warn(
    `[URL Resolver] ${platform}:${normalizedHandle} API方式にフォールバック`
  );
  try {
    const apiUrl = await fetchChannelUrlFromApi(platform, normalizedHandle);
    if (apiUrl) {
      console.info(
        `[URL Resolver] ${platform}:${normalizedHandle} API方式で取得成功 -> ${apiUrl}`
      );
      urlCache.set(cacheKey, apiUrl);
      return apiUrl;
    }
  } catch (error) {
    console.error(
      `[URL Resolver] ${platform}:${normalizedHandle} API方式失敗: ${(error as Error).message}`
    );
  }
  console.warn(
    `[URL Resolver] ${platform}:${normalizedHandle} 既定フォーマットURLを使用 -> ${defaultUrl}`
  );
  urlCache.set(cacheKey, defaultUrl);
  return defaultUrl;
};

export { defaultUrlBuilders };
