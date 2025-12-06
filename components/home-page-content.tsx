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
}) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof document === 'undefined') return true;
    const stored = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith('sidebar_state='))
      ?.split('=')[1];
    return stored !== undefined ? stored === 'true' : true;
  });

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
      <SidebarInset className="flex h-screen w-screen min-w-0 overflow-hidden bg-background text-foreground">
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
          <div className="flex flex-1 min-h-0 w-full flex-col overflow-y-auto bg-muted/20">
            {/* justify-start + my-auto ensures content is centered if space allows, 
                but scrolls naturally if content is taller than viewport.
            */}
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-start py-6 md:justify-center md:py-8">
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
