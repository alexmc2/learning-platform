'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import { toast } from 'sonner';

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

type SessionUser = {
  id: string;
  email?: string;
} | null;

export function HomePageContent({
  videos,
  currentId,
  currentVideo,
  prevId,
  nextId,
  user,
  showSyncButton = false,
  showImportButton = true,
  promptSave = false,
  courseSaved = false,
  hasSavedCourses = false,
  showClearLibraryButton = false,
  initialSidebarOpen = true,
}: {
  videos: Video[];
  currentId?: number;
  currentVideo?: Video | null;
  prevId?: number;
  nextId?: number;
  user: SessionUser;
  showSyncButton?: boolean;
  showImportButton?: boolean;
  promptSave?: boolean;
  courseSaved?: boolean;
  hasSavedCourses?: boolean;
  showClearLibraryButton?: boolean;
  initialSidebarOpen?: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(initialSidebarOpen);

  useEffect(() => {
    if (courseSaved) {
      toast.success('Course saved successfully', {
        description: 'Your progress is now being tracked.',
      });

      const url = new URL(window.location.href);
      url.searchParams.delete('courseSaved');
      window.history.replaceState({}, '', url);
    }
  }, [courseSaved]);

  if (videos.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-muted/10 overflow-y-auto">
        <PageHeader
          user={user}
          videos={[]}
          showImportButton={false}
          onImportPage
        />
        <main className="flex w-full flex-1 flex-col items-start justify-start px-4 py-8 md:items-center md:justify-center md:py-10">
          <div className="w-full max-w-6xl my-auto">
            <EmptyState />
          </div>
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
      style={
        {
          '--sidebar-width': '20rem',
          '--sidebar-width-mobile': '18rem',
          '--sidebar-width-icon': '3rem',
        } as CSSProperties
      }
    >
      <AppSidebar videos={videos} currentId={currentId} />
      <SidebarInset className="flex min-h-svh w-full min-w-0 overflow-x-hidden bg-background text-foreground">
        <div className="flex h-full w-full min-w-0 flex-col">
          <PageHeader
            user={user}
            videos={videos}
            showSidebarTrigger
            showSyncButton={showSyncButton}
            showImportButton={showImportButton}
            promptSaveModal={promptSave}
            hasSavedCourses={hasSavedCourses}
            showClearLibraryButton={showClearLibraryButton}
          />

          {/* Main content wrapper */}
          <div className="flex flex-1 min-h-0 w-full flex-col">
            {/* justify-start + my-auto ensures content is centered if space allows, 
                but scrolls naturally if content is taller than viewport.
            */}
            <div className="mx-auto flex w-full flex-1 flex-col justify-start md:justify-center ">
              {currentVideo ? (
                <div className="my-auto w-full">
                  <VideoPlayer
                    key={currentVideo.id}
                    video={currentVideo}
                    prevId={prevId}
                    nextId={nextId}
                    canTrackProgress={Boolean(user)}
                  />
                </div>
              ) : (
                <div className="my-auto flex w-full flex-1 items-center justify-center p-4">
                  <EmptyState />
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
