import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import dynamic from "next/dynamic";
import type { TooltipItem } from "chart.js";
import { cn } from "@/lib/utils";
import type { WatchRanking, YearEndResponse } from "@/types/chzzk";

const Pie = dynamic(
  async () => {
    const mod = await import("react-chartjs-2");
    return mod.Pie;
  },
  { ssr: false },
);

const chartJsRegister = async () => {
  const ChartJS = await import("chart.js");
  const {
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Chart,
  } = ChartJS;
  const { default: ChartDataLabels } = await import("chartjs-plugin-datalabels");

  Chart.register(ArcElement, Title, Tooltip, Legend, ChartDataLabels);
  Chart.defaults.color = "#f8fafc";
  Chart.defaults.font.family =
    'var(--font-nanum-gothic), var(--font-geist-sans), system-ui, -apple-system, "Segoe UI", sans-serif';
};

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;
}

function formatNumber(num: number) {
  return num.toLocaleString("ko-KR");
}

type PieRow = { label: string; value: number };

function WatchPie({ rows }: { rows: PieRow[] }) {
  if (!rows.length) return null;
  const colors = [
    "#60a5fa",
    "#34d399",
    "#fbbf24",
    "#f472b6",
    "#c084fc",
    "#a3e635",
    "#fb7185",
  ];
  const labels = rows.map((r) => r.label);
  const values = rows.map((r) => r.value);
  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: labels.map((_, i) => colors[i % colors.length]),
        borderWidth: 0,
        radius: "68%",
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: 32 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        borderColor: "rgba(255,255,255,0.12)",
        borderWidth: 1,
        titleColor: "#f8fafc",
        bodyColor: "#f8fafc",
        callbacks: {
          title: (items: TooltipItem<"pie">[]) => items[0]?.label ?? "",
          label: (ctx: TooltipItem<"pie">) => {
            const val = Number(ctx.raw ?? 0);
            const total = ctx.dataset.data.reduce((sum, v) => sum + v, 0);
            const percent = total > 0 ? (val / total) * 100 : 0;
            return ` ${formatDuration(val)} (${percent.toFixed(1)}%)`;
          },
        },
      },
      datalabels: {
        display: false,
      },
    },
  };
  return (
    <div className="mx-auto flex h-[26rem] w-full max-w-3xl items-center justify-center overflow-visible">
      <Pie data={data} options={options} />
    </div>
  );
}

function buildWatchStats(watchRankingList: WatchRanking[]) {
  const total = watchRankingList.reduce(
    (sum, item) => sum + item.totalWatchingTime,
    0,
  );
  const rows = watchRankingList
    .map((item) => ({
      channelId: item.channelId,
      channelName: item.channelName,
      channelImageUrl: item.channelImageUrl,
      totalWatchingTime: item.totalWatchingTime,
    }))
    .sort((a, b) => b.totalWatchingTime - a.totalWatchingTime);

  return { total, rows };
}

function RankingItem({ item }: { item: WatchRanking }) {
  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        <Badge className="text-base" variant="secondary">
          #{item.ranking}
        </Badge>
        <div className="relative h-14 w-14 overflow-hidden rounded-lg border">
          <Image
            src={item.channelImageUrl}
            alt={item.channelName}
            fill
            sizes="56px"
            className="object-cover"
          />
        </div>
        <a
          href={`https://chzzk.naver.com/${item.channelId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-base font-semibold leading-tight truncate max-w-[240px] sm:max-w-xs hover:underline"
        >
          {item.channelName}
        </a>
      </div>
      <div className="grid w-full gap-2 text-sm text-muted-foreground sm:grid-cols-2 md:grid-cols-2 sm:max-w-md sm:ml-auto">
        <span>시청 시간: {formatDuration(item.totalWatchingTime)}</span>
        <span>통나무 파워: {formatNumber(item.totalLogPowers)}</span>
        <span>클립 제작: {formatNumber(item.totalMakerClipCount)}</span>
        <span>클립 조회: {formatNumber(item.totalMakerClipPlayCount)}</span>
      </div>
    </Card>
  );
}

function SummaryCards({ data }: { data: YearEndResponse }) {
  const { totalWatchingTime, totalLogPowers, segmentType } = data.content;
  const summary = useMemo(
    () => [
      {
        title: "총 시청 시간",
        value: formatDuration(totalWatchingTime),
      },
      {
        title: "총 통나무 파워",
        value: formatNumber(totalLogPowers),
      },
      {
        title: "주 시청 시간",
        value: segmentType,
      },
    ],
    [totalWatchingTime, totalLogPowers, segmentType],
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {summary.map((item) => (
        <Card key={item.title}>
          <CardHeader className="pb-4">
            <CardDescription>{item.title}</CardDescription>
            <CardTitle className="text-2xl font-bold">{item.value}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

type RecapClientProps = {
  data: YearEndResponse;
  source?: YearEndResponse["source"] | "default" | "paste";
  className?: string;
};

export function RecapClient({ data, source = "default", className }: RecapClientProps) {
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await chartJsRegister();
        if (mounted) setChartReady(true);
      } catch (err) {
        console.error("Chart.js 초기화 실패:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const watchStats = useMemo(
    () => buildWatchStats(data.content.watchRankingList),
    [data.content.watchRankingList],
  );

  const rankings = useMemo(
    () =>
      [...data.content.watchRankingList].sort(
        (a, b) => a.ranking - b.ranking,
      ),
    [data.content.watchRankingList],
  );

  return (
    <div className={cn("space-y-6", className)}>
      <SummaryCards data={data} />

      <Card>
        <CardHeader>
          <CardTitle>가장 많이 본 채널</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rankings.length === 0 && (
            <p className="text-sm text-muted-foreground">시청 기록이 없습니다.</p>
          )}
          <div className="space-y-3">
            {rankings.map((item) => (
              <RankingItem key={item.channelId} item={item} />
            ))}
          </div>

          {watchStats.rows.length > 0 && chartReady && (
            <div className="pt-4 space-y-4">
              <WatchPie
                rows={watchStats.rows.map((r) => ({
                  label: r.channelName,
                  value: r.totalWatchingTime,
                }))}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

