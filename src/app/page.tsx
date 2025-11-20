"use client";

import { useCallback, useEffect, useState } from "react";
import { ChannelTable, SortKey, SortState } from "./components/ChannelTable";
import { FilterBar } from "./components/FilterBar";
import type { Channel } from "@/types/channel";

type FilterState = {
  platform: string;
  period: string;
  metric: string;
};

const defaultFilters: FilterState = {
  platform: "youtube",
  period: "1m",
  metric: "subscribers",
};

const defaultSort: SortState = {
  key: "subscribers_gain",
  direction: "desc",
};

export default function Home() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [sort, setSort] = useState<SortState>(defaultSort);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(async (query: FilterState) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams(query).toString();

    try {
      const response = await fetch(`/api/channels?${params}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch");
      }
      const data = await response.json();
      setChannels(data.channels ?? []);
    } catch (err) {
      console.error(err);
      setError("データの取得に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels(filters);
  }, [fetchChannels, filters]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleRefresh = () => {
    fetchChannels(filters);
  };

  const handleSortChange = (key: SortKey) => {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: key === "profile_image" ? "asc" : "desc" };
    });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8">
      <FilterBar values={filters} onChange={handleFilterChange} onRefresh={handleRefresh} loading={loading} />
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <ChannelTable channels={channels} sort={sort} onSortChange={handleSortChange} />
      <p className="pb-8 text-center text-xs text-slateglass-500">
        ※ 総登録者数が10万人以下のチャンネルのみ表示しています。
      </p>
    </main>
  );
}
