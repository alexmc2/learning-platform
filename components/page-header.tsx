'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { SyncButton } from '@/components/sync-button';
import { SaveCourseModal } from '@/components/save-course-modal';
import { AuthDialog } from '@/components/auth/auth-dialog';
import { LogoutButton } from '@/components/auth/logout-button';

import Link from 'next/link';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

type HeaderUser = {
  id: string;
  email?: string;
} | null;

type PageHeaderProps = {
  user: HeaderUser;
  videos?: { id: number; title: string; section?: string }[];
  showSidebarTrigger?: boolean;
  showSyncButton?: boolean;
  hasSavedCourses?: boolean;
  onCoursesPage?: boolean;
  showImportButton?: boolean;
  onImportPage?: boolean;
};

export function PageHeader({
  user,
  videos = [],
  showSidebarTrigger = false,
  showSyncButton = false,
  onCoursesPage = false,
  showImportButton = false,
  onImportPage = false,
}: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex shrink-0 flex-col gap-3 border-b border-border/60 bg-white/95 px-4 py-4 backdrop-blur dark:bg-background lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {showSidebarTrigger ? <SidebarTrigger /> : null}
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Learning Platform
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {showSyncButton ? <SyncButton /> : null}
          {user ? (
            <>
              {videos.length > 0 ? <SaveCourseModal videos={videos} /> : null}
              {showImportButton && !onImportPage ? (
                <Button asChild variant="outline" size="sm">
                  <Link href="/import">Import course</Link>
                </Button>
              ) : null}
              {onCoursesPage ? (
                <Button asChild variant="default" size="sm">
                  <Link href="/">Back to course</Link>
                </Button>
              ) : (
                <Button asChild variant="default" size="sm">
                  <Link href="/courses">My courses</Link>
                </Button>
              )}
              <LogoutButton />
            </>
          ) : (
            <>
              {showImportButton && !onImportPage ? (
                <Button asChild variant="outline" size="sm">
                  <Link href="/import">Import course</Link>
                </Button>
              ) : null}
              <AuthDialog />
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
