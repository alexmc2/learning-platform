'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  MoveHorizontal,
  Search,
  Trophy,
} from 'lucide-react';

import { setVideosCompletion } from '@/app/actions/video';
import { Badge } from '@/components/ui/badge';
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
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

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
  sidebarWidth,
  onSidebarWidthChange,
}: {
  videos: VideoListItem[];
  currentId?: number;
  sidebarWidth: number;
  onSidebarWidthChange: (nextWidth: number) => void;
}) {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const [query, setQuery] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [pendingSection, setPendingSection] = useState<string | null>(null);

  const completedCount = useMemo(
    () => videos.filter((video) => video.completed).length,
    [videos]
  );

  const grouped = useMemo(() => groupVideos(videos, query), [videos, query]);

  const toggleSection = (section: string) => {
    setOpenSections((previous) => {
      const isOpen = previous[section] ?? false;
      return { ...previous, [section]: !isOpen };
    });
  };

  const handleSectionCompletion = useCallback(
    async (section: string, videoIds: number[], complete: boolean) => {
      if (videoIds.length === 0) return;
      setPendingSection(section);

      try {
        const formData = new FormData();
        formData.append('videoIds', JSON.stringify(videoIds));
        formData.append('completed', complete ? 'true' : 'false');
        await setVideosCompletion(formData);
      } finally {
        setPendingSection((current) => (current === section ? null : current));
      }
    },
    []
  );

  return (
    <Sidebar
      collapsible="offcanvas"
      className="relative border-r border-sidebar-border"
    >
      <SidebarHeader className="gap-3">
        <ProgressSummary completed={completedCount} total={videos.length} />
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
                        'h-4 w-4 transition-transform',
                        isOpen ? 'rotate-0' : '-rotate-90'
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
                    <SectionCompletionToggle
                      section={section}
                      items={items}
                      pending={pendingSection === section}
                      onToggle={(nextCompleted) =>
                        handleSectionCompletion(
                          section,
                          items.map((item) => item.id),
                          nextCompleted
                        )
                      }
                    />
                    <SidebarMenu className="space-y-1">
                      {items.map((video) => {
                        const isActive = video.id === currentId;
                        const nextUrl = courseId
                          ? `/?courseId=${courseId}&v=${video.id}`
                          : `/?v=${video.id}`;

                        return (
                          <SidebarMenuItem key={video.id}>
                            <SidebarMenuButton
                              asChild
                              isActive={isActive}
                              className="items-start gap-3"
                              tooltip={video.title}
                            >
                              <Link href={nextUrl}>
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
                                      <Badge
                                        variant="outline"
                                        className="px-1.5 py-0"
                                      >
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
      <SidebarResizeHandle
        sidebarWidth={sidebarWidth}
        onSidebarWidthChange={onSidebarWidthChange}
      />
    </Sidebar>
  );
}

export const SIDEBAR_MIN_WIDTH = 260;
export const SIDEBAR_MAX_WIDTH = 520;
export const SIDEBAR_DEFAULT_WIDTH = 320;

type ResizeHandleProps = {
  sidebarWidth: number;
  onSidebarWidthChange: (nextWidth: number) => void;
};

function SidebarResizeHandle({
  sidebarWidth,
  onSidebarWidthChange,
}: ResizeHandleProps) {
  const { isMobile, state } = useSidebar();
  const handleRef = useRef<HTMLButtonElement>(null);
  const sidebarContainerRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const draggingRef = useRef(false);

  const clampWidth = useCallback((value: number) => {
    const rounded = Math.round(value);
    return Math.min(
      SIDEBAR_MAX_WIDTH,
      Math.max(SIDEBAR_MIN_WIDTH, rounded)
    );
  }, []);

  useEffect(() => {
    if (!handleRef.current) return;
    sidebarContainerRef.current = handleRef.current.closest(
      '[data-slot="sidebar-container"]'
    ) as HTMLDivElement | null;
  }, []);

  useEffect(() => {
    return () => {
      document.body.style.removeProperty('user-select');
      document.body.style.removeProperty('cursor');
    };
  }, []);

  if (isMobile || state === 'collapsed') {
    return null;
  }

  const handlePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (event.button !== 0) return;
    draggingRef.current = true;
    pointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return;
    const left =
      sidebarContainerRef.current?.getBoundingClientRect().left ?? 0;
    const nextWidth = clampWidth(event.clientX - left);
    onSidebarWidthChange(nextWidth);
  };

  const stopDragging = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (pointerIdRef.current !== null) {
      event.currentTarget.releasePointerCapture(pointerIdRef.current);
      pointerIdRef.current = null;
    }
    document.body.style.removeProperty('user-select');
    document.body.style.removeProperty('cursor');
  };

  return (
    <button
      type="button"
      ref={handleRef}
      aria-label="Drag to resize sidebar"
      role="separator"
      aria-orientation="vertical"
      aria-valuemin={SIDEBAR_MIN_WIDTH}
      aria-valuemax={SIDEBAR_MAX_WIDTH}
      aria-valuenow={sidebarWidth}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      className={cn(
        'absolute -right-1.5 top-0 z-20 hidden h-full w-3 cursor-col-resize items-center justify-center rounded-sm bg-transparent transition-colors md:flex',
        'focus-visible:outline focus-visible:outline-offset-0 focus-visible:outline-indigo-300',
        'hover:bg-sidebar-border/40 active:bg-sidebar-border/60'
      )}
    >
      <span className="flex h-12 w-3 items-center justify-center rounded-sm border border-sidebar-border/70 bg-sidebar/80 shadow-sm">
        <MoveHorizontal className="h-3 w-3 text-sidebar-foreground/70" />
      </span>
    </button>
  );
}

function ProgressSummary({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressPercent =
    total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100));

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className="flex w-full items-center gap-3 rounded-lg border border-indigo-500/70 bg-indigo-700 px-2.5 py-2 text-left shadow-sm transition hover:border-indigo-400 hover:bg-indigo-600 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-indigo-300 cursor-pointer"
      >
        <div
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(#22c55e ${progressPercent}%, rgba(148,163,184,0.5) ${progressPercent}% 100%)`,
          }}
        >
          <div className="absolute inset-[3px] rounded-full border border-white/20 bg-indigo-800 shadow-inner" />
          <Trophy className="relative h-5 w-5 text-white" />
        </div>
        <div className="flex flex-1 items-center justify-between gap-2">
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-indigo-50">
              Your progress
            </span>
            <span className="text-xs text-indigo-100/80">
              {completed}/{total} lessons
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm font-bold text-indigo-50">
            {progressPercent}%
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform text-indigo-100/80',
                open ? 'rotate-180' : 'rotate-0'
              )}
              aria-hidden
            />
          </div>
        </div>
      </button>
      {open ? (
        <div className="absolute left-0 right-auto top-full z-20 mt-3 w-[min(320px,calc(100vw-2.5rem))]">
          <div className="relative">
            <div className="absolute left-10 -top-2 h-4 w-4 rotate-45 rounded-sm border border-indigo-500/70 bg-indigo-700 shadow-md" />
            <div className="rounded-xl border border-indigo-500/70 bg-indigo-700/95 px-4 py-3 text-indigo-50 shadow-2xl backdrop-blur supports-backdrop-filter:bg-indigo-700/85">
              <p className="text-md font-bold text-indigo-50">
                {completed} of {total} complete.
              </p>
              <p className="mt-2 text-sm text-indigo-100/85">
                {total === 0
                  ? 'Start your first lesson to track progress.'
                  : 'Keep going to finish the course and earn your win.'}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type GroupedVideos = {
  section: string;
  completed: number;
  items: VideoListItem[];
};

function SectionCompletionToggle({
  section,
  items,
  pending,
  onToggle,
}: {
  section: string;
  items: VideoListItem[];
  pending: boolean;
  onToggle: (nextCompleted: boolean) => void;
}) {
  const checkboxRef = useRef<HTMLInputElement>(null);
  const total = items.length;
  const completedCount = items.filter((item) => item.completed).length;
  const allComplete = total > 0 && completedCount === total;
  const someComplete = completedCount > 0 && !allComplete;

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = someComplete;
    }
  }, [someComplete]);

  return (
    <label className="mb-2 flex items-center justify-between rounded-md border border-sidebar-border/70 bg-sidebar/50 px-2.5 py-2 text-sm text-sidebar-foreground">
      <span className="flex items-center gap-2">
        <input
          ref={checkboxRef}
          type="checkbox"
          className="h-4 w-4 rounded border-indigo-400 bg-indigo-700 text-emerald-500 focus:ring-emerald-500 disabled:opacity-50"
          checked={allComplete}
          onChange={() => onToggle(!allComplete)}
          disabled={pending || total === 0}
          aria-label={`Mark all videos in ${section} as complete`}
        />
        <span>Mark all as complete</span>
      </span>
      <span className="text-xs text-sidebar-foreground/70">
        {completedCount}/{total}
      </span>
    </label>
  );
}

function groupVideos(videos: VideoListItem[], query: string): GroupedVideos[] {
  const term = query.trim().toLowerCase();
  const seenOrder = new Map<string, number>();
  const groups = new Map<string, GroupedVideos>();

  videos.forEach((video, index) => {
    if (
      term &&
      !video.title.toLowerCase().includes(term) &&
      !(video.section ?? '').toLowerCase().includes(term)
    ) {
      return;
    }

    const section = video.section ?? 'Library';

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
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
