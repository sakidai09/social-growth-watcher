import { clsx } from "clsx";
import { useMemo } from "react";
import type { Channel } from "@/types/channel";

export type SortKey =
  | "profile_image"
  | "name"
  | "platform"
  | "subscribers_gain"
  | "views_gain"
  | "likes_gain"
  | "total_subscribers"
  | "url";

export type SortState = {
  key: SortKey;
  direction: "asc" | "desc";
};

type Props = {
  channels: Channel[];
  sort: SortState;
  onSortChange: (key: SortKey) => void;
};

const platformLabels: Record<string, { label: string; color: string; icon: string }> = {
  youtube: { label: "YouTube", color: "bg-red-100 text-red-600", icon: "▶" },
  tiktok: { label: "TikTok", color: "bg-slate-800 text-white", icon: "♬" },
  instagram: { label: "Instagram", color: "bg-gradient-to-r from-pink-500 to-orange-400 text-white", icon: "◎" },
};

const columns: { key: SortKey; label: string; align?: "left" | "right" }[] = [
  { key: "profile_image", label: "プロフィール" },
  { key: "name", label: "チャンネル名" },
  { key: "platform", label: "プラットフォーム" },
  { key: "subscribers_gain", label: "登録者数増加", align: "right" },
  { key: "views_gain", label: "再生数増加", align: "right" },
  { key: "likes_gain", label: "いいね数増加", align: "right" },
  { key: "total_subscribers", label: "総登録者数", align: "right" },
  { key: "url", label: "チャンネルURL" },
];

export function ChannelTable({ channels, sort, onSortChange }: Props) {
  const sortedChannels = useMemo(() => {
    const copy = [...channels];
    return copy.sort((a, b) => {
      const valueA = a[sort.key];
      const valueB = b[sort.key];

      if (typeof valueA === "number" && typeof valueB === "number") {
        return sort.direction === "asc" ? valueA - valueB : valueB - valueA;
      }

      return sort.direction === "asc"
        ? String(valueA).localeCompare(String(valueB))
        : String(valueB).localeCompare(String(valueA));
    });
  }, [channels, sort]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={clsx(
                    "cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slateglass-600",
                    column.align === "right" && "text-right"
                  )}
                  onClick={() => onSortChange(column.key)}
                >
                  <div className="flex items-center gap-1">
                    <span>{column.label}</span>
                    {sort.key === column.key && (
                      <span className="text-[10px] text-slateglass-500">
                        {sort.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-sm text-slateglass-800">
            {sortedChannels.map((channel) => {
              const platformMeta = platformLabels[channel.platform];
              const linkProps = {
                href: channel.url,
                target: "_blank",
                rel: "noopener noreferrer",
              } as const;
              return (
                <tr
                  key={`${channel.platform}-${channel.handle}-${channel.name}`}
                  className="hover:bg-slate-50/80"
                >
                  <td className="px-4 py-3">
                    <a {...linkProps} className="inline-flex">
                      <img
                        src={channel.profile_image}
                        alt={`${channel.name}のプロフィール`}
                        className="h-12 w-12 rounded-full border border-slate-200 object-cover"
                      />
                    </a>
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    <a {...linkProps} className="text-slateglass-800 hover:underline">
                      {channel.name}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                        platformMeta?.color ?? "bg-slate-200 text-slate-700"
                      )}
                    >
                      <span>{platformMeta?.icon ?? "•"}</span>
                      {platformMeta?.label ?? channel.platform}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm">
                    +{channel.subscribers_gain.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm">
                    +{channel.views_gain.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm">
                    +{channel.likes_gain.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm">
                    {channel.total_subscribers.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      {...linkProps}
                      className="truncate text-xs text-slateglass-600 hover:underline"
                    >
                      {channel.url}
                    </a>
                  </td>
                </tr>
              );
            })}
            {sortedChannels.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-slateglass-500">
                  条件に合致するチャンネルが見つかりませんでした。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
