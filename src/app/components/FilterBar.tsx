import { clsx } from "clsx";

type FilterValue = {
  platform: string;
  period: string;
  metric: string;
};

type Props = {
  values: FilterValue;
  onChange: (key: keyof FilterValue, value: string) => void;
  onRefresh: () => void;
  loading: boolean;
};

const selectClass =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-slateglass-500";

export function FilterBar({ values, onChange, onRefresh, loading }: Props) {
  return (
    <section className="grid w-full gap-4 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slateglass-500">
            Social Growth Watcher
          </p>
          <h1 className="text-2xl font-bold text-slateglass-800">伸びている新星チャンネル</h1>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className={clsx(
            "rounded-full bg-slateglass-700 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slateglass-800",
            loading && "pointer-events-none opacity-60"
          )}
        >
          {loading ? "更新中..." : "更新"}
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm text-slateglass-600">
          プラットフォーム
          <select
            className={`${selectClass} mt-1`}
            value={values.platform}
            onChange={(event) => onChange("platform", event.target.value)}
          >
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="all">すべて</option>
          </select>
        </label>
        <label className="text-sm text-slateglass-600">
          期間
          <select
            className={`${selectClass} mt-1`}
            value={values.period}
            onChange={(event) => onChange("period", event.target.value)}
          >
            <option value="1m">直近1ヶ月</option>
            <option value="2w">直近2週間</option>
            <option value="1w">直近1週間</option>
          </select>
        </label>
        <label className="text-sm text-slateglass-600">
          指標
          <select
            className={`${selectClass} mt-1`}
            value={values.metric}
            onChange={(event) => onChange("metric", event.target.value)}
          >
            <option value="subscribers">登録者数</option>
            <option value="views">再生数</option>
            <option value="likes">いいね数</option>
          </select>
        </label>
      </div>
    </section>
  );
}
