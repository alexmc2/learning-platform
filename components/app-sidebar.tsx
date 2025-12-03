"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, Circle, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type VideoListItem = {
  id: number;
  title: string;
  completed: boolean;
  duration: number | null;
  section?: string;
};

export function AppSidebar({
  videos,
  currentId,
}: {
  videos: VideoListItem[];
  currentId?: number;
}) {
  const [query, setQuery] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const completedCount = useMemo(
    () => videos.filter((video) => video.completed).length,
    [videos],
  );

  const grouped = useMemo(() => groupVideos(videos, query), [videos, query]);

  const toggleSection = (section: string) => {
    setOpenSections((previous) => {
      const isOpen = previous[section] ?? false;
      return { ...previous, [section]: !isOpen };
    });
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
      <SidebarHeader className="gap-3">
        <div className="flex items-center justify-between gap-2">
     
          <Badge variant="secondary" className="px-2 py-1 text-[11px]">
            {completedCount}/{videos.length} done
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sidebar-foreground/60" />
          <SidebarInput
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search lessons..."
            className="pl-9"
          />
        </div>
      </SidebarHeader>
    
      <SidebarContent className="sidebar-scroll px-2 pb-4">
        <div className="space-y-2">
          {grouped.map(({ section, items, completed }) => {
            const isOpen = openSections[section] ?? false;

            return (
              <SidebarGroup
                key={section}
                className="rounded-lg border border-sidebar-border/70 bg-sidebar/60"
              >
                <SidebarGroupLabel asChild>
                  <button
                    type="button"
                    onClick={() => toggleSection(section)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left font-semibold uppercase tracking-wide text-sidebar-foreground/80 cursor-pointer"
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isOpen ? "rotate-0" : "-rotate-90",
                      )}
                    />
                    <span className="flex-1 truncate">{section}</span>
                    <span className="text-sm font-medium text-sidebar-foreground/60">
                      {completed}/{items.length}
                    </span>
                  </button>
                </SidebarGroupLabel>
                {isOpen ? (
                  <SidebarGroupContent className="px-1 pb-2">
                    <SidebarMenu className="space-y-1">
                      {items.map((video) => {
                        const isActive = video.id === currentId;

                        return (
                          <SidebarMenuItem key={video.id}>
                            <SidebarMenuButton
                              asChild
                              isActive={isActive}
                              className="items-start gap-3"
                              tooltip={video.title}
                            >
                              <Link href={`/?v=${video.id}`}>
                                {video.completed ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <Circle className="h-4 w-4 text-sidebar-foreground/60" />
                                )}
                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                  <span className="truncate text-md font-medium">
                                    {video.title}
                                  </span>
                                  <div className="flex items-center gap-2 text-sm text-sidebar-foreground/70">
                                    <span>Video</span>
                                    {video.duration ? (
                                      <Badge variant="outline" className="px-1.5 py-0">
                                        {formatDuration(video.duration)}
                                      </Badge>
                                    ) : null}
                                  </div>
                                </div>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                ) : null}
              </SidebarGroup>
            );
          })}
          {grouped.length === 0 ? (
            <div className="rounded-lg border border-sidebar-border/60 bg-sidebar/60 px-3 py-6 text-md text-sidebar-foreground/70">
              No videos match your search.
            </div>
          ) : null}
        </div>
      </SidebarContent>
    </Sidebar>
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
