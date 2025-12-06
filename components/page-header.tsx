'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useState } from 'react';

import { ThemeToggle } from '@/components/theme-toggle';
import { SyncButton } from '@/components/sync-button';
import { SaveCourseModal } from '@/components/save-course-modal';
import { AuthDialog } from '@/components/auth/auth-dialog';
import { LogoutButton } from '@/components/auth/logout-button';
import { clearAllVideos } from '@/app/actions/sync';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

type HeaderUser = {
  id: string;
  email?: string;
} | null;

type PageHeaderProps = {
  user: HeaderUser;
  videos?: { id: number; title: string; section?: string }[];
  showSidebarTrigger?: boolean;
  showSyncButton?: boolean;
  onCoursesPage?: boolean;
  showImportButton?: boolean;
  onImportPage?: boolean;
  promptSaveModal?: boolean;
  hasSavedCourses?: boolean;
  showClearLibraryButton?: boolean;
};

export function PageHeader({
  user,
  videos = [],
  showSidebarTrigger = false,
  showSyncButton = false,
  onCoursesPage = false,
  showImportButton = false,
  onImportPage = false,
  promptSaveModal = false,
  hasSavedCourses = false,
  showClearLibraryButton = false,
}: PageHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Helper to render buttons cleanly
  const renderActionButtons = (isMobile: boolean) => {
    // Mobile buttons: larger, left-aligned text, extra padding
    const btnSize = isMobile ? 'default' : 'sm';
    const btnClass = isMobile ? 'w-full justify-start pl-4' : '';

    return (
      <>
        {showSyncButton && (
          <div className={isMobile ? 'w-full' : ''}>
            <SyncButton />
          </div>
        )}

        {user ? (
          <>
            {videos.length > 0 && (promptSaveModal || !hasSavedCourses) && (
              <div className={isMobile ? 'w-full' : ''}>
                <SaveCourseModal videos={videos} forceOpen={promptSaveModal} />
              </div>
            )}

            {showClearLibraryButton && (
              <form
                action={async () => clearAllVideos()}
                className={isMobile ? 'w-full' : ''}
              >
                <Button
                  variant="outline"
                  size={btnSize}
                  type="submit"
                  className={btnClass}
                >
                  Clear library
                </Button>
              </form>
            )}

            {showImportButton && !onImportPage && (
              <Button
                asChild
                variant="outline"
                size={btnSize}
                className={btnClass}
              >
                <Link href="/import" onClick={() => setMobileMenuOpen(false)}>
                  Import course
                </Link>
              </Button>
            )}

            {onCoursesPage ? (
              <Button
                asChild
                variant="default"
                size={btnSize}
                className={btnClass}
              >
                <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                  Back to course
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                variant="default"
                size={btnSize}
                className={btnClass}
              >
                <Link href="/courses" onClick={() => setMobileMenuOpen(false)}>
                  My courses
                </Link>
              </Button>
            )}

            {isMobile && (
              <div className="w-full pt-4 border-t mt-2">
                <LogoutButton
                  size={btnSize}
                  className="w-full justify-start pl-4"
                />
              </div>
            )}
            {!isMobile && <LogoutButton size={btnSize} />}
          </>
        ) : (
          <>
            {showImportButton && !onImportPage && (
              <Button
                asChild
                variant="outline"
                size={btnSize}
                className={btnClass}
              >
                <Link href="/import" onClick={() => setMobileMenuOpen(false)}>
                  Import course
                </Link>
              </Button>
            )}
            <div className={isMobile ? 'w-full' : ''}>
              <AuthDialog />
            </div>
          </>
        )}
      </>
    );
  };

  return (
    // Z-index lowered to 40 to ensure Sheet (z-50) sits on top
    <header className="sticky top-0 z-40 flex shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-white/95 px-4 py-2 backdrop-blur dark:bg-background lg:px-8 lg:py-4">
      <div className="flex items-center gap-3">
        {showSidebarTrigger && <SidebarTrigger />}
        <Link href="/" className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight lg:text-2xl">
            Learning Platform
          </h1>
        </Link>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden items-center gap-3 md:flex">
        {renderActionButtons(false)}
        <ThemeToggle />
      </div>

      {/* Mobile Navigation */}
      <div className="flex items-center gap-2 md:hidden">
        <ThemeToggle />
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menu">
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[85vw] sm:w-[350px] overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle className="text-left text-lg font-bold">
                Menu
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-3">
              {renderActionButtons(true)}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
