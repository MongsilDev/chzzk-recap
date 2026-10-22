"use client";

import { useState, type ReactNode } from "react";
import { RecapClient } from "@/components/recap/recap-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { yearEndSchema } from "@/lib/chzzk-schema";
import type { YearEndResponse } from "@/types/chzzk";

type SourceType = "paste";

export default function Home() {
  const [data, setData] = useState<YearEndResponse | null>(null);
  const [source, setSource] = useState<SourceType>("paste");
  const [rawInput, setRawInput] = useState("");
  const [error, setError] = useState<ReactNode>(null);

  const handleApply = () => {
    setError(null);
    if (!rawInput.trim()) {
      setError("JSON 페이지 내용을 복사해 붙여넣어주세요.");
      return;
    }
    try {
      const json = JSON.parse(rawInput);
      // 로그아웃 상태 응답은 빈 목록에 segmentType null
      if (json?.content?.segmentType === null && json.content.watchRankingList?.length === 0) {
        setError("치지직에 로그인한 뒤 JSON 페이지를 다시 열어주세요.");
        return;
      }
      const parsed = yearEndSchema.parse(json);
      setData({ ...parsed, source: "paste" });
      setSource("paste");
    } catch {
      setError(
        <>
          치지직 연말결산 JSON이 아닙니다.
          <br />
          JSON 페이지 내용을 전부 복사해 다시 붙여넣어주세요.
        </>,
      );
    }
  };

  return (
    <main className="container space-y-8 py-12">
      <h1 className="text-3xl font-bold leading-tight">CHZZK RECAPS</h1>

      <Card>
        <CardHeader>
          <CardTitle>연말결산 JSON</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="JSON 페이지 내용을 복사해 붙여넣어주세요."
            aria-label="연말결산 JSON"
            className="min-h-[120px]"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleApply}>적용</Button>
            {[2025, 2024].map((year) => (
              <Button key={year} asChild variant="outline">
                <a
                  href={`https://api.chzzk.naver.com/service/v1/year-end-users?year=${year}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {year} JSON
                </a>
              </Button>
            ))}
          </div>
          {error && (
            <p className="rounded-md bg-destructive px-3 py-2 text-sm text-destructive-foreground">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {data ? <RecapClient data={data} source={source} /> : null}
    </main>
  );
}
