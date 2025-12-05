'use client';

import { useState } from 'react';
import { HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConnectLocalModal } from '@/components/connect-local-modal';
import {
  ConnectJellyfinModal,
  type JellyfinVideo,
} from '@/components/connect-jellyfin-modal';
import { ThemedBounceLoader } from '@/components/themed-bounce-loader';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { importJellyfinVideos } from '@/app/actions/sync';

function JellyfinLogo({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm-1.14 3.742h2.28v3.63H10.86V3.742Zm0 12.875h2.28v3.642H10.86v-3.642Zm-6.932-5.7h16.146v2.222H3.928v-2.22Zm3.465-4.475h9.213v2.223H7.393V6.442Zm0 8.922h9.213v2.223H7.393v-2.223Z" />
    </svg>
  );
}

function YouTubeLogo({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export function EmptyState() {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleConnected = async (videos: JellyfinVideo[]) => {
    if (!videos.length) return;

    setIsImporting(true);

    try {
      const result = await importJellyfinVideos(videos);
      if (!result?.ok) {
        throw new Error('Failed to import videos');
      }
      window.location.href = '/?promptSave=1&source=jellyfin';
    } catch (error) {
      console.error('Jellyfin import failed', error);
      toast({
        title: 'Import failed',
        description:
          'Something went wrong while importing your videos. Please try again.',
        variant: 'destructive',
      });
      setIsImporting(false);
    }
  };

  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-12 px-6 py-10">
      {isImporting ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-3xl bg-background/90 backdrop-blur-sm">
          <ThemedBounceLoader
            size={72}
            ariaLabel="Importing videos"
            dataTestid="jellyfin-import-loader"
          />
          <div className="text-center space-y-1">
            <p className="text-base font-semibold">Importing your videos…</p>
            <p className="text-sm text-muted-foreground">
              Hang tight while we save them to your library.
            </p>
          </div>
        </div>
      ) : null}
      <div className="text-center space-y-4 max-w-lg">
        <h2 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Ready to Learn?
        </h2>
        <p className="text-lg text-muted-foreground">
          Connect a media source to populate your library and start tracking
          your progress.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
        {/* Jellyfin Card */}
        <Card
          className={cn(
            'group relative flex flex-col items-center justify-between overflow-hidden border-2 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
            'border-muted bg-card hover:border-[#a21caf]/50 dark:hover:border-[#a21caf]/70'
          )}
        >
          <div className="absolute inset-0 bg-linear-to-br from-[#a21caf]/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="z-10 flex flex-col items-center gap-4 text-center">
            <div className="rounded-2xl bg-[#a21caf]/10 p-4 text-[#a21caf] ring-1 ring-[#a21caf]/20 transition-all duration-300 group-hover:bg-[#a21caf] group-hover:text-white group-hover:ring-[#a21caf]">
              <JellyfinLogo className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-xl">Jellyfin</h3>
              <p className="text-sm text-muted-foreground">
                Stream from your self-hosted media server.
              </p>
            </div>
          </div>

          <div className="z-10 mt-8 w-full">
            <ConnectJellyfinModal onConnected={handleConnected}>
              <Button className="w-full bg-[#a21caf] text-white hover:bg-[#a21caf]/90">
                Connect Server
              </Button>
            </ConnectJellyfinModal>
          </div>
        </Card>

        {/* Local Files Card */}
        <Card
          className={cn(
            'group relative flex flex-col items-center justify-between overflow-hidden border-2 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
            'border-muted bg-card hover:border-blue-600/50 dark:hover:border-blue-600/70'
          )}
        >
          <div className="absolute inset-0 bg-linear-to-br from-blue-600/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="z-10 flex flex-col items-center gap-4 text-center">
            <div className="rounded-2xl bg-blue-600/10 p-4 text-blue-600 ring-1 ring-blue-600/20 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:ring-blue-600">
              <HardDrive className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-xl">Local Files</h3>
              <p className="text-sm text-muted-foreground">
                Scan your device&apos;s video folder.
              </p>
              <p className="text-sm text-muted-foreground">
                (Available on local machine only)
              </p>
            </div>
          </div>

          <div className="z-10 mt-8 w-full">
            <ConnectLocalModal>
              <Button className="w-full bg-blue-700 text-white hover:bg-blue-800">
                Scan Folder
              </Button>
            </ConnectLocalModal>
          </div>
        </Card>

        {/* YouTube Card */}
        <Card
          className={cn(
            'group relative flex flex-col items-center justify-between overflow-hidden border-2 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
            'border-muted bg-card hover:border-red-600/50 dark:hover:border-red-600/70'
          )}
        >
          <div className="absolute inset-0 bg-linear-to-br from-red-600/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="z-10 flex flex-col items-center gap-4 text-center">
            <div className="rounded-2xl bg-red-600/10 p-4 text-red-600 ring-1 ring-red-600/20 transition-all duration-300 group-hover:bg-red-600 group-hover:text-white group-hover:ring-red-600">
              <YouTubeLogo className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-xl">YouTube</h3>
              <p className="text-sm text-muted-foreground">
                Import playlists for offline tracking.
              </p>
            </div>
          </div>

          <div className="z-10 mt-8 w-full">
            <Button
              variant="outline"
              className="w-full cursor-not-allowed opacity-50 hover:bg-transparent"
              disabled
            >
              Coming Soon
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
