'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { SyncButton } from '@/components/sync-button';

import { SidebarTrigger } from '@/components/ui/sidebar';

export function PageHeader() {
  return (
    <header className="sticky top-0 z-10 flex shrink-0 flex-col gap-3 border-b border-border/60 bg-white/95 px-4 py-4 backdrop-blur dark:bg-background lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Learning Platform
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SyncButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
