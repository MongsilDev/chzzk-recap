import Image from "next/image";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import dynamic from "next/dynamic";
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

function formatDurationPair(minutes: number) {
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = minutes % 60;
  const totalHours = Math.floor(minutes / 60);

  const main =
    days > 0
      ? `${days}일 ${hours}시간 ${mins}분`
      : hours > 0
        ? `${hours}시간 ${mins}분`
        : `${mins}분`;

  const alt = days > 0 ? `${totalHours}시간 ${mins}분` : undefined;

  return { main, alt };
}

function formatNumber(num: number) {
  return num.toLocaleString("ko-KR");
}

type PieRow = { label: string; value: number; percent?: number };

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
          title: (ctx: any) => {
            const label = ctx[0]?.label ?? "";
            return label;
          },
          label: (ctx: any) => {
            const val = ctx.raw ?? 0;
            const percent = ctx.parsed !== undefined && ctx.dataset && ctx.dataset.data
              ? (() => {
                  const total = ctx.dataset.data.reduce(
                    (sum: number, v: number) => sum + v,
                    0,
                  );
                  return total > 0 ? (val / total) * 100 : 0;
                })()
              : 0;
            const hours = Math.floor(val / 60);
            const days = Math.floor(hours / 24);
            const remHours = hours % 24;
            const mins = val % 60;
            const duration =
              days > 0
                ? `${days}일 ${remHours}시간 ${mins}분`
                : hours > 0
                  ? `${hours}시간 ${mins}분`
                  : `${mins}분`;
            return ` ${duration} (${percent.toFixed(1)}%)`;
          },
        },
      },
      datalabels: {
        display: false,
      },
    },
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-6">
        <div className="flex w-full flex-col gap-2 md:w-1/3">
          {rows.map((row, idx) => (
            <div
              key={row.label}
              className="flex flex-col gap-1 rounded-lg border border-muted/60 bg-card/60 px-3 py-2 text-sm text-foreground"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: colors[idx % colors.length] }}
                  aria-hidden
                />
                <span className="truncate break-words leading-tight">{row.label}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="whitespace-nowrap">
                  {(() => {
                    const minutes = row.value;
                    const hours = Math.floor(minutes / 60);
                    const days = Math.floor(hours / 24);
                    const remHours = hours % 24;
                    const mins = minutes % 60;
                    if (days > 0) return `${days}일 ${remHours}시간 ${mins}분`;
                    if (hours > 0) return `${hours}시간 ${mins}분`;
                    return `${mins}분`;
                  })()}
                </span>
                {row.percent !== undefined ? (
                  <span className="whitespace-nowrap">{row.percent.toFixed(1)}%</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <div className="h-[26rem] w-full max-w-3xl flex items-center justify-center overflow-visible md:w-2/3">
          <Pie data={data} options={options} />
        </div>
      </div>
    </div>
  );
}

function buildWatchStats(watchRankingList: WatchRanking[]) {
  const total = watchRankingList.reduce(
    (sum, item) => sum + item.totalWatchingTime,
    0,
  );
  const rows = watchRankingList
    .map((item) => {
      const percent = total > 0 ? (item.totalWatchingTime / total) * 100 : 0;
      return {
        channelId: item.channelId,
        channelName: item.channelName,
        channelImageUrl: item.channelImageUrl,
        totalWatchingTime: item.totalWatchingTime,
        percent,
      };
    })
    .sort((a, b) => b.totalWatchingTime - a.totalWatchingTime);

  return { total, rows };
}

function RankingItem({ item }: { item: WatchRanking }) {
  const watchTime = formatDurationPair(item.totalWatchingTime);

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
        <div>
          <p className="text-base font-semibold leading-tight truncate max-w-[240px] sm:max-w-xs">
            {item.channelName}
          </p>
          <Button asChild variant="outline" size="sm" className="mt-1 h-8 px-3">
            <a
              href={`https://chzzk.naver.com/${item.channelId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              채널 바로가기
            </a>
          </Button>
        </div>
      </div>
      <div className="grid w-full gap-2 text-sm text-muted-foreground sm:grid-cols-2 md:grid-cols-2 sm:max-w-md sm:ml-auto">
        <span className="flex flex-col">
          {watchTime.alt ? (
            <span className="group inline-block cursor-help">
              <span className="underline decoration-dotted decoration-muted-foreground/70 group-hover:hidden transition-opacity">
                시청 시간: {watchTime.main}
              </span>
              <span className="hidden underline decoration-dotted decoration-muted-foreground/70 group-hover:inline transition-opacity">
                시청 시간: {watchTime.alt}
              </span>
            </span>
          ) : (
            <span>시청 시간: {watchTime.main}</span>
          )}
        </span>
        <span>통나무 파워: {formatNumber(item.totalLogPowers)}</span>
        <span>클립 제작: {formatNumber(item.totalMakerClipCount)}</span>
        <span>클립 조회: {formatNumber(item.totalMakerClipPlayCount)}</span>
      </div>
    </Card>
  );
}

function SummaryCards({ data }: { data: YearEndResponse }) {
  const { totalWatchingTime, totalLogPowers, segmentType } = data.content;
  const totalWatch = formatDurationPair(totalWatchingTime);
  const summary = useMemo(
    () => [
      {
        title: "총 시청 시간",
        value: totalWatch.main,
        alt: totalWatch.alt,
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
    [totalWatch.main, totalWatch.alt, totalLogPowers, segmentType],
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {summary.map((item) => (
        <Card key={item.title}>
          <CardHeader className="pb-4">
            <CardDescription>{item.title}</CardDescription>
            {item.alt ? (
              <CardTitle className="text-2xl font-bold group inline-flex items-baseline gap-1 cursor-help">
                <span className="group-hover:hidden underline decoration-dotted decoration-muted-foreground/70 transition-opacity">
                  {item.value}
                </span>
                <span className="hidden group-hover:inline underline decoration-dotted decoration-muted-foreground/70 transition-opacity">
                  {item.alt}
                </span>
              </CardTitle>
            ) : (
              <CardTitle className="text-2xl font-bold">{item.value}</CardTitle>
            )}
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
  useMemo(() => {
    void chartJsRegister();
  }, []);

  const watchStats = useMemo(
    () => buildWatchStats(data.content.watchRankingList),
    [data.content.watchRankingList],
  );

  const rankings = useMemo(
    () =>
      [...(data?.content?.watchRankingList ?? [])].sort(
        (a, b) => a.ranking - b.ranking,
      ),
    [data?.content?.watchRankingList],
  );

  return (
    <div className={cn("space-y-6", className)}>
      <SummaryCards data={data} />

      <Card>
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>올해 내가 가장 본 채널</CardTitle>
            <CardDescription>
              입력한 JSON을 바탕으로 순위를 정리했어요.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {rankings.length === 0 && (
            <p className="text-sm text-muted-foreground">
              아직 데이터가 없어요. JSON을 넣어 주세요.
            </p>
          )}
          <div className="space-y-3">
            {rankings.map((item) => (
              <RankingItem key={item.channelId} item={item} />
            ))}
          </div>

          {watchStats.rows.length > 0 && (
            <div className="pt-4 space-y-4">
              <WatchPie
                rows={watchStats.rows.map((r) => ({
                  label: r.channelName,
                  value: r.totalWatchingTime,
                  percent: r.percent,
                }))}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

