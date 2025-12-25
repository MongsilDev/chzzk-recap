import { z } from "zod";

export const watchRankingSchema = z.object({
  channelId: z.string(),
  channelName: z.string(),
  channelImageUrl: z.string().url(),
  ranking: z.number(),
  totalWatchingTime: z.number(),
  totalLogPowers: z.number(),
  totalMakerClipPlayCount: z.number(),
  totalMakerClipValidPlayCount: z.number(),
  totalMakerClipCount: z.number(),
});

export const yearEndSchema = z.object({
  code: z.number(),
  message: z.string().nullable(),
  content: z.object({
    watchRankingList: z.array(watchRankingSchema),
    totalWatchingTime: z.number(),
    totalLogPowers: z.number(),
    segmentType: z.string(),
  }),
});

export type YearEndSchema = z.infer<typeof yearEndSchema>;

