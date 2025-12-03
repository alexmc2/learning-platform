'use client';

import { useState, type CSSProperties } from 'react';

import { AppSidebar } from '@/components/app-sidebar';
import { PageHeader } from '@/components/page-header';
import { VideoPlayer } from '@/components/video-player';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { EmptyState } from '@/components/empty-state';

type Video = {
  id: number;
  title: string;
  completed: boolean;
  duration: number | null;
  section?: string;
  path: string;
};

export function HomePageContent({
  videos,
  currentId,
  currentVideo,
  prevId,
  nextId,
}: {
  videos: Video[];
  currentId?: number;
  currentVideo?: Video | null;
  prevId?: number;
  nextId?: number;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof document === 'undefined') return true;
    const stored = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith('sidebar_state='))
      ?.split('=')[1];
    return stored !== undefined ? stored === 'true' : true;
  });

  return (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
      style={
        {
          '--sidebar-width': '22rem',
          '--sidebar-width-mobile': '23rem',
          '--sidebar-width-icon': '4.25rem',
        } as CSSProperties
      }
    >
      <AppSidebar videos={videos} currentId={currentId} />
      <SidebarInset className="flex h-screen w-screen min-w-0 overflow-hidden bg-background text-foreground">
        <div className="flex h-full w-full min-w-0 flex-col">
          <PageHeader />

          {/* Main Content Area */}
          <div className="flex flex-1 min-h-0 items-center justify-center overflow-y-auto overflow-x-hidden bg-muted/20">
            <div className="w-full max-w-full">
              {currentVideo ? (
                <VideoPlayer
                  key={currentVideo.id}
                  video={currentVideo}
                  prevId={prevId}
                  nextId={nextId}
                />
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
