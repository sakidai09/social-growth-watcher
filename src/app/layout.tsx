import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Social Growth Watcher",
  description: "登録者数が伸びている新進気鋭のチャンネルを素早く把握できるダッシュボード",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-slateglass-50 text-slate-900">{children}</body>
    </html>
  );
}
