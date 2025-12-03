"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type VideoListItem = {
  id: number;
  title: string;
  completed: boolean;
  duration: number | null;
  section?: string;
};

export function VideoList({ videos, currentId }: { videos: VideoListItem[]; currentId?: number }) {
  const [query, setQuery] = useState("");
  const completedCount = useMemo(
    () => videos.filter((video) => video.completed).length,
    [videos],
  );

  const grouped = useMemo(() => groupVideos(videos, query), [videos, query]);

  return (
    <Card className="h-full border-border/60 bg-card/80  backdrop-blur">
      <CardHeader className="flex flex-col gap-3 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-semibold">Course Content</CardTitle>
            <p className="text-xs text-muted-foreground">Search and jump between lessons.</p>
          </div>
          <Badge variant="secondary" className="px-2 py-1 text-[11px]">
            {completedCount}/{videos.length} done
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search lessons..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-lg border border-border/70 bg-muted/40 py-2 pl-9 pr-3 text-sm shadow-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-230px)]">
          <div className="space-y-3 p-2">
            {grouped.map(({ section, items, completed }) => (
              <div key={section} className="space-y-2 rounded-xl border border-border/70 bg-card/60 px-2 py-2">
                <div className="flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span className="truncate">{section}</span>
                  <span className="text-[11px] font-medium">
                    {completed}/{items.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {items.map((video) => {
                    const isActive = video.id === currentId;
                    return (
                      <Link
                        key={video.id}
                        href={`/?v=${video.id}`}
                        className={cn(
                          "group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 transition-colors",
                          isActive
                            ? "border-primary/50 bg-primary/10 text-primary-foreground shadow-sm"
                            : "hover:bg-muted/70",
                        )}
                      >
                        {video.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <p
                            className={cn(
                              "truncate text-sm font-medium",
                              isActive && "text-primary-foreground",
                            )}
                          >
                            {video.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Video</span>
                            {video.duration ? (
                              <Badge variant="outline" className="px-1.5 py-0">
                                {formatDuration(video.duration)}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
            {grouped.length === 0 ? (
              <div className="px-3 py-10 text-center text-sm text-muted-foreground">
                No videos match your search.
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

type GroupedVideos = {
  section: string;
  completed: number;
  items: VideoListItem[];
};

function groupVideos(videos: VideoListItem[], query: string): GroupedVideos[] {
  const term = query.trim().toLowerCase();
  const seenOrder = new Map<string, number>();
  const groups = new Map<string, GroupedVideos>();

  videos.forEach((video, index) => {
    if (
      term &&
      !video.title.toLowerCase().includes(term) &&
      !(video.section ?? "").toLowerCase().includes(term)
    ) {
      return;
    }

    const section = video.section ?? "Library";

    if (!groups.has(section)) {
      seenOrder.set(section, index);
      groups.set(section, { section, items: [], completed: 0 });
    }

    const group = groups.get(section)!;
    group.items.push(video);
    if (video.completed) {
      group.completed += 1;
    }
  });

  return Array.from(groups.values()).sort((a, b) => {
    const orderA = seenOrder.get(a.section) ?? 0;
    const orderB = seenOrder.get(b.section) ?? 0;
    return orderA - orderB;
  });
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
