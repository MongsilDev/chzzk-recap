export type WatchRanking = {
  channelId: string;
  channelName: string;
  channelImageUrl: string;
  ranking: number;
  totalWatchingTime: number;
  totalLogPowers: number;
  totalMakerClipPlayCount: number;
  totalMakerClipValidPlayCount: number;
  totalMakerClipCount: number;
};

export type YearEndContent = {
  watchRankingList: WatchRanking[];
  totalWatchingTime: number;
  totalLogPowers: number;
  segmentType: string;
};

export type YearEndResponse = {
  code: number;
  message: string | null;
  content: YearEndContent;
  source?: "live" | "fallback" | "unauthenticated" | "default" | "paste";
};

