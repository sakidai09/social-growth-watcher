import type { Platform } from "@/types/channel";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

export const defaultUrlBuilders: Record<Platform, (handle: string) => string> = {
  youtube: (handle) => `https://www.youtube.com/@${handle}`,
  tiktok: (handle) => `https://www.tiktok.com/@${handle}`,
  instagram: (handle) => `https://www.instagram.com/${handle}/`,
};

export const defaultProfileBuilders: Record<Platform, (handle: string) => string> = {
  youtube: (handle) => `https://unavatar.io/youtube/${handle}`,
  tiktok: (handle) => `https://unavatar.io/tiktok/${handle}`,
  instagram: (handle) => `https://unavatar.io/instagram/${handle}`,
};

const scrapeTargets: Record<Platform, (handle: string) => string> = {
  youtube: (handle) => defaultUrlBuilders.youtube(handle),
  tiktok: (handle) => defaultUrlBuilders.tiktok(handle),
  instagram: (handle) => defaultUrlBuilders.instagram(handle),
};

type ChannelMetadata = {
  url: string;
  profileImage: string;
};

const metadataCache = new Map<string, ChannelMetadata>();

const canonicalFromHtml = (html: string) => {
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  const ogMatch = html.match(/property=["']og:url["'][^>]+content=["']([^"']+)["']/i);
  const imageMatch = html.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i);

  return {
    canonical: canonicalMatch?.[1] ?? ogMatch?.[1] ?? null,
    ogImage: imageMatch?.[1] ?? null,
  };
};

const isReachable = async (url: string) => {
  try {
    const head = await fetch(url, { method: "HEAD" });
    if (head.ok || head.status === 405) {
      return true;
    }
    const get = await fetch(url, { method: "GET" });
    return get.ok;
  } catch (error) {
    console.warn(`[URL Resolver] ${url} の到達性確認に失敗: ${(error as Error).message}`);
    return false;
  }
};

const verifyUrlCandidates = async (candidates: string[], prefix: string) => {
  for (const candidate of candidates) {
    if (await isReachable(candidate)) {
      console.info(`[URL Resolver] ${prefix} 到達性確認OK -> ${candidate}`);
      return candidate;
    }
    console.warn(`[URL Resolver] ${prefix} 到達性NG -> ${candidate}`);
  }
  return candidates[0];
};

const scrapeMetadata = async (
  platform: Platform,
  handle: string,
  defaultProfile: string
): Promise<ChannelMetadata | null> => {
  const target = scrapeTargets[platform](handle);
  try {
    const response = await fetch(target, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const html = await response.text();
    const { canonical, ogImage } = canonicalFromHtml(html);
    if (canonical || ogImage) {
      console.info(
        `[URL Resolver] ${platform}:${handle} スクレイピングで取得成功 -> url:${canonical ?? "(none)"} icon:${ogImage ?? "(none)"}`
      );
      return {
        url: canonical ?? scrapeTargets[platform](handle),
        profileImage: ogImage ?? defaultProfile,
      };
    }
    console.warn(
      `[URL Resolver] ${platform}:${handle} スクレイピングでcanonical/icon取得できず`
    );
    return null;
  } catch (error) {
    console.warn(
      `[URL Resolver] ${platform}:${handle} スクレイピング失敗: ${(error as Error).message}`
    );
    return null;
  }
};

type ApiMetadata = { url?: string; profileImage?: string };

const fetchYoutubeUrlFromApi = async (handle: string): Promise<ApiMetadata> => {
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
  const profileImage =
    channelData?.items?.[0]?.snippet?.thumbnails?.high?.url ||
    channelData?.items?.[0]?.snippet?.thumbnails?.default?.url;

  const url = customUrl
    ? customUrl.startsWith("@")
      ? `https://www.youtube.com/${customUrl}`
      : `https://www.youtube.com/@${customUrl}`
    : `https://www.youtube.com/channel/${channelId}`;

  return { url, profileImage };
};

const fetchTikTokUrlFromApi = async (handle: string): Promise<ApiMetadata> => {
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
  const profileImage =
    data?.data?.user?.avatarThumb || data?.user?.avatar_thumb || undefined;
  return { url: `https://www.tiktok.com/@${username}`, profileImage };
};

const fetchInstagramUrlFromApi = async (handle: string): Promise<ApiMetadata> => {
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
  const authorUrl = data?.author_url || profileUrl;
  const profileImage =
    data?.thumbnail_url ||
    (data?.author_url?.includes("instagram.com/")
      ? `${authorUrl}profile_pic`
      : undefined);
  return { url: authorUrl, profileImage };
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

const reachableCandidates = (platform: Platform, handle: string, base: string) => {
  const normalized = handle.replace(/^@/, "");
  switch (platform) {
    case "youtube":
      return [
        base,
        `https://www.youtube.com/${normalized.startsWith("channel/") ? normalized : `channel/${normalized}`}`,
        `https://www.youtube.com/user/${normalized}`,
        `https://www.youtube.com/c/${normalized}`,
        "https://www.youtube.com/",
      ];
    case "tiktok":
      return [
        base,
        `https://m.tiktok.com/@${normalized}`,
        `https://www.tiktok.com/@${normalized}?lang=ja-JP`,
        "https://www.tiktok.com/",
      ];
    case "instagram":
      return [
        base,
        `https://instagram.com/${normalized}`,
        `https://www.instagram.com/${normalized}`,
        "https://www.instagram.com/",
      ];
    default:
      return [base];
  }
};

const pickProfileImage = async (
  candidate: string | undefined,
  fallback: string
) => {
  if (candidate && (await isReachable(candidate))) {
    return candidate;
  }
  if (candidate) {
    console.warn(`[URL Resolver] プロフィール画像到達不可、フォールバック採用 -> ${fallback}`);
  }
  return fallback;
};

export const resolveChannelMetadata = async (
  platform: Platform,
  handle: string,
  fallbackUrl?: string,
  fallbackProfile?: string
): Promise<ChannelMetadata> => {
  const cacheKey = `${platform}:${handle}`;
  if (metadataCache.has(cacheKey)) {
    return metadataCache.get(cacheKey)!;
  }

  const normalizedHandle = handle.replace(/^@/, "").trim();
  const defaultUrl = fallbackUrl ?? defaultUrlBuilders[platform](normalizedHandle);
  const defaultProfile =
    fallbackProfile ?? defaultProfileBuilders[platform](normalizedHandle);

  const scraped = await scrapeMetadata(platform, normalizedHandle, defaultProfile);
  const apiMetaPrefix = `${platform}:${normalizedHandle}`;

  let apiMeta: ApiMetadata | null = null;
  if (!scraped) {
    console.warn(`[URL Resolver] ${apiMetaPrefix} API方式にフォールバック`);
    try {
      apiMeta = await fetchChannelUrlFromApi(platform, normalizedHandle);
      console.info(
        `[URL Resolver] ${apiMetaPrefix} API方式で取得成功 -> url:${apiMeta?.url ?? "(none)"} icon:${apiMeta?.profileImage ?? "(none)"}`
      );
    } catch (error) {
      console.error(
        `[URL Resolver] ${apiMetaPrefix} API方式失敗: ${(error as Error).message}`
      );
    }
  }

  const candidateUrl = scraped?.url ?? apiMeta?.url ?? defaultUrl;
  const profileCandidate = scraped?.profileImage ?? apiMeta?.profileImage;

  const verifiedUrl = await verifyUrlCandidates(
    reachableCandidates(platform, normalizedHandle, candidateUrl),
    apiMetaPrefix
  );

  const profileImage = await pickProfileImage(profileCandidate, defaultProfile);

  const resolved = { url: verifiedUrl, profileImage } satisfies ChannelMetadata;
  metadataCache.set(cacheKey, resolved);
  return resolved;
};
