"use client";

import { useState } from "react";
import { RecapClient } from "@/components/recap/recap-client";
import { Badge } from "@/components/ui/badge";
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
  const [error, setError] = useState<string | null>(null);

  const handleApply = () => {
    setError(null);
    if (!rawInput.trim()) {
      setError("JSON을 입력해 주세요.");
      return;
    }
    try {
      const parsed = yearEndSchema.parse(JSON.parse(rawInput));
      setData({ ...parsed, source: "paste" });
      setSource("paste");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`JSON을 읽는 중 문제가 있어요: ${err.message}`);
      } else {
        setError("JSON을 읽는 중 문제가 있어요.");
      }
    }
  };

  return (
    <main className="container space-y-8 py-12">
      <header className="space-y-3">
        <Badge variant="secondary" className="uppercase">
          CHZZK RECAPS
        </Badge>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold leading-tight">CHZZK RECAPS</h1>
          <p className="text-muted-foreground">
            JSON을 넣으면 치지직 리캡을 바로 볼 수 있어요.
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>JSON 입력</CardTitle>
          <p className="text-sm text-muted-foreground">
            아래 링크에서 JSON을 복사해 입력해 주세요.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="여기에 JSON을 입력해 주세요"
            className="min-h-[120px]"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleApply}>JSON 적용하기</Button>
            <Button asChild variant="outline">
              <a
                href="https://api.chzzk.naver.com/service/v1/year-end-users?year=2025"
                target="_blank"
                rel="noopener noreferrer"
              >
                JSON 보러가기
              </a>
            </Button>
            <Badge variant="secondary" className="whitespace-nowrap">
              2024년 리캡을 보려면 링크의 2025를 2024로 변경해 주세요.
            </Badge>
            {error && <Badge variant="destructive">{error}</Badge>}
          </div>
        </CardContent>
      </Card>

      {data ? <RecapClient data={data} source={source} /> : null}
    </main>
  );
}
