'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  useEffect,
  useRef,
  useState,
  useOptimistic,
  type MouseEvent,
} from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Film,
  FolderOpen,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';

import { useLocalPlayback } from '@/components/providers/local-playback-provider';
import { setVideoCompletion } from '@/app/actions/video';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type VideoPlayerProps = {
  video: {
    id: number;
    title: string;
    completed: boolean;
    duration: number | null;
    path: string;
    section?: string;
  };
  prevId?: number;
  nextId?: number;
  canTrackProgress?: boolean;
};

export function VideoPlayer({
  video,
  prevId,
  nextId,
  canTrackProgress = false,
}: VideoPlayerProps) {
  const { isLinked, linkFolder, getFileBlobUrl } = useLocalPlayback();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const isRemote = video.path.startsWith('http');
  const streamUrl = isRemote ? video.path : `/api/stream?id=${video.id}`;
  const fileLabel = getFileLabel(video.path);
  const [optimisticCompleted, setOptimisticCompleted] = useOptimistic(
    video.completed,
    (state, newCompleted: boolean) => newCompleted,
  );
  const nextCompletedValue = (!optimisticCompleted).toString();
  const videoRef = useRef<HTMLVideoElement>(null);

  async function handleToggleCompletion(formData: FormData) {
    const newCompleted = formData.get('completed') === 'true';
    setOptimisticCompleted(newCompleted);
    await setVideoCompletion(formData);
  }

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration ?? 0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isTouch, setIsTouch] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(false);

  const [localUrl, setLocalUrl] = useState<string | null>(null);

  const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  const getLink = (id: number) => {
    return courseId ? `/?courseId=${courseId}&v=${id}` : `/?v=${id}`;
  };

  // -- Effects --

  // Attempt to resolve local file if needed
  useEffect(() => {
    // If not remote and we have access to local files, try to resolve it
    if (!isRemote && isLinked) {
      getFileBlobUrl(video.path).then((blobUrl) => {
        if (blobUrl) {
          setLocalUrl(blobUrl);
          setErrorMessage(null);
        }
      });
    }
  }, [isRemote, isLinked, video.path, getFileBlobUrl]);

  // Handle Fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const activeElement = document.fullscreenElement;
      const playerElement = videoRef.current;
      setIsFullscreen(activeElement === playerElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle Playback Rate
  useEffect(() => {
    const el = videoRef.current;
    if (el) {
      el.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Handle Touch Detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(pointer: coarse)');
    const updateTouch = (event?: MediaQueryListEvent) => {
      const matches = event ? event.matches : mql.matches;
      setIsTouch(matches);
      if (matches) {
        setControlsVisible(true);
      }
    };
    updateTouch();
    if (mql.addEventListener) {
      mql.addEventListener('change', updateTouch);
      return () => mql.removeEventListener('change', updateTouch);
    }
    mql.addListener(updateTouch);
    return () => mql.removeListener(updateTouch);
  }, []);

  // -- Handlers --

  const describePlaybackIssue = (
    mediaError?: MediaError | null,
    domError?: unknown,
  ) => {
    if (typeof MediaError !== 'undefined' && mediaError) {
      switch (mediaError.code) {
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          return 'This browser cannot play the provided video source.';
        case MediaError.MEDIA_ERR_DECODE:
          return 'The video file appears to be corrupted or in an unsupported format.';
        case MediaError.MEDIA_ERR_NETWORK:
          return 'Network error while loading the video.';
        case MediaError.MEDIA_ERR_ABORTED:
          return 'Video playback was aborted.';
        default:
          return 'Video playback failed.';
      }
    }
    if (
      domError instanceof DOMException &&
      domError.name === 'NotSupportedError'
    ) {
      return 'This browser cannot play the provided video source.';
    }
    return 'Video playback failed.';
  };

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      const playPromise = el.play();
      if (playPromise && typeof playPromise.then === 'function') {
        void playPromise
          .then(() => {
            setIsPlaying(true);
            setErrorMessage(null);
          })
          .catch((err) => {
            setErrorMessage(describePlaybackIssue(el.error, err));
            setIsPlaying(false);
          });
      } else {
        setIsPlaying(true);
        setErrorMessage(null);
      }
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const el = videoRef.current;
    if (!el) return;
    setCurrentTime(el.currentTime);
    setDuration(el.duration || 0);
    setIsPlaying(!el.paused);
  };

  const handleLoadedMetadata = () => {
    const el = videoRef.current;
    if (!el) return;
    setDuration(el.duration || 0);
    setErrorMessage(null);
  };

  const handleSeek = (value: number) => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = value;
    setCurrentTime(value);
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    const nextMuted = !isMuted;
    el.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (value: number) => {
    const el = videoRef.current;
    if (!el) return;
    el.volume = value;
    setVolume(value);
    if (value > 0 && isMuted) {
      el.muted = false;
      setIsMuted(false);
    }
  };

  const toggleFullscreen = () => {
    const el = videoRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      void el.requestFullscreen();
    } else if (document.exitFullscreen) {
      void document.exitFullscreen();
    }
  };

  const handleVideoError = () => {
    const el = videoRef.current;
    setErrorMessage(describePlaybackIssue(el?.error));
    setIsPlaying(false);
  };

  const progressPercent =
    duration && duration > 0
      ? Math.min(100, (currentTime / duration) * 100)
      : 0;

  const handleVideoAreaClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('[data-video-controls="true"]')) {
      return;
    }
    if (!isTouch) {
      const coarse = window.matchMedia
        ? window.matchMedia('(pointer: coarse)').matches
        : false;
      if (coarse) {
        setIsTouch(true);
        setControlsVisible(true);
        return;
      }
      togglePlay();
      return;
    }
    setControlsVisible((prev) => !prev);
  };

  const renderControls = () => {
    const baseVisibility =
      'absolute inset-x-0 bottom-0 z-10 pb-3 transition-opacity duration-200';
    const hoverVisibility = !isTouch
      ? 'group-hover/video:opacity-100 group-hover/video:pointer-events-auto group-focus-within/video:opacity-100 group-focus-within/video:pointer-events-auto'
      : '';
    const manualVisibility = controlsVisible
      ? 'opacity-100 pointer-events-auto'
      : 'opacity-0 pointer-events-none';
    const shellClass = 'flex flex-wrap items-center gap-3';

    return (
      <div
        data-video-controls="true"
        className={`${baseVisibility} ${hoverVisibility} ${manualVisibility} flex flex-col gap-2 px-2 sm:px-4`}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Seek Bar */}
        <div className="pointer-events-auto px-2 sm:px-0">
          <input
            type="range"
            min={0}
            max={duration || video.duration || 0}
            step={0.1}
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="sm:h-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 outline-none"
            style={{
              background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${progressPercent}%, rgba(0,0,0,0.45) ${progressPercent}%, rgba(0,0,0,0.45) 100%)`,
            }}
            aria-label="Seek"
          />
        </div>

        {/* Buttons Row */}
        <div className={`${shellClass} px-0 sm:px-2`}>
          <div className="flex items-center gap-2 rounded-md bg-black/60 px-2 py-1.5 md:gap-3 md:px-3 md:py-2">
            <button
              type="button"
              onClick={togglePlay}
              className="grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:h-10 md:w-10"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 md:h-5 md:w-5" />
              ) : (
                <Play className="h-4 w-4 md:h-5 md:w-5" />
              )}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:h-10 md:w-10"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4 md:h-5 md:w-5" />
              ) : (
                <Volume2 className="h-4 w-4 md:h-5 md:w-5" />
              )}
            </button>

            {/* Hidden volume slider on very small screens to save space */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="hidden h-1 w-16 cursor-pointer accent-white sm:block md:w-24"
              aria-label="Volume"
            />

            <div className="ml-1 flex items-center gap-1 text-[10px] font-medium text-white/80 md:ml-2 md:text-xs">
              <span className="tabular-nums">
                {formatDuration(Math.floor(currentTime))}
              </span>
              <span className="text-white/50">/</span>
              <span className="tabular-nums">
                {formatDuration(Math.floor(duration || video.duration || 0))}
              </span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 rounded-md bg-black/60 px-2 py-1.5 md:gap-3 md:px-3 md:py-2">
            <select
              id="playback-rate"
              value={playbackRate}
              onChange={(e) => setPlaybackRate(Number(e.target.value))}
              className="cursor-pointer rounded-md bg-white/10 px-2 py-1 text-[10px] font-medium text-white outline-none transition hover:bg-white/20 md:px-3 md:py-2 md:text-xs"
              style={{ cursor: 'pointer' }}
            >
              {playbackSpeeds.map((rate) => (
                <option key={rate} value={rate} className="bg-black text-white">
                  {rate}x
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:h-10 md:w-10"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4 md:h-5 md:w-5" />
              ) : (
                <Maximize2 className="h-4 w-4 md:h-5 md:w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const finalSrc = localUrl || streamUrl;

  return (
    <Card className="flex w-full flex-col overflow-hidden border-none bg-background shadow-none sm:px-6 px-0">
      <CardContent className="p-0">
        <div className="flex w-full flex-col items-center justify-center gap-3">
          <div
            className="group/video relative aspect-video w-full max-h-[70vh] overflow-hidden bg-background"
            onClick={handleVideoAreaClick}
          >
            <video
              ref={videoRef}
              key={video.id}
              className="h-full w-full cursor-pointer bg-background object-contain"
              preload="metadata"
              src={finalSrc}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleVideoError}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {/* Overlay controls (hover on desktop, tap to toggle on touch) */}
            {renderControls()}
          </div>
        </div>

        {errorMessage ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 flex w-full flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <p>{errorMessage}</p>

            {!isRemote && !localUrl && (
              <div className="mb-2 rounded-md bg-background/50 p-3">
                <p className="mb-2 font-medium text-foreground">
                  Is this a local file?
                </p>
                <p className="mb-3 text-xs text-muted-foreground">
                  If you are viewing this on a deployed site, the server cannot
                  access your local files directly. You need to grant permission
                  to your local video folder.
                </p>
                <Button
                  onClick={() => linkFolder()}
                  variant="secondary"
                  size="sm"
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Connect Local Folder
                </Button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <a
                  href={streamUrl}
                  download
                  className="underline-offset-4 hover:underline"
                >
                  Download the video instead
                </a>
              </Button>
              <span className="text-xs text-muted-foreground">
                If the issue persists, try a different browser or check the file
                format.
              </span>
            </div>
          </div>
        ) : null}
      </CardContent>

      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {optimisticCompleted ? (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 text-emerald-600"
            >
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1">
              <Circle className="h-4 w-4" />
              In Progress
            </Badge>
          )}
          <Separator orientation="vertical" className="h-6" />
          <CardDescription className="flex items-center gap-2 text-sm">
            <Film className="h-4 w-4" />
            {video.duration ? `~${formatDuration(video.duration)}` : fileLabel}
          </CardDescription>
        </div>
        <div className="flex flex-col gap-1">
          {video.section ? (
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {video.section}
            </p>
          ) : null}
          <CardTitle className="text-2xl font-semibold leading-tight">
            {video.title}
          </CardTitle>
        </div>
      </CardHeader>

      {/* Mobile Footer Layout */}
      <CardFooter className="flex flex-col gap-3 border-t border-border/60 px-6 py-4 md:hidden">
        <div className="grid w-full grid-cols-2 gap-3">
          {prevId ? (
            <Button asChild variant="default" size="lg" className="w-full">
              <Link href={getLink(prevId)}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Link>
            </Button>
          ) : (
            <Button variant="default" size="lg" disabled className="w-full">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}
          {nextId ? (
            <Button asChild variant="default" size="lg" className="w-full">
              <Link href={getLink(nextId)}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="default" size="lg" disabled className="w-full">
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        <form action={handleToggleCompletion} className="w-full">
          <input type="hidden" name="videoId" value={video.id} />
          <input type="hidden" name="completed" value={nextCompletedValue} />
          <Button
            type="submit"
            size="lg"
            disabled={!canTrackProgress}
            variant={optimisticCompleted ? 'default' : 'default'}
            className="w-full"
          >
            {optimisticCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
          </Button>
        </form>
      </CardFooter>

      {/* Desktop Footer Layout */}
      <CardFooter className="hidden flex-wrap items-center gap-3 md:flex">
        <div className="flex items-center gap-2">
          {prevId ? (
            <Button asChild variant="default" size="lg">
              <Link href={getLink(prevId)}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Link>
            </Button>
          ) : (
            <Button variant="default" size="lg" disabled>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}
          {nextId ? (
            <Button asChild variant="default" size="lg">
              <Link href={getLink(nextId)}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="default" size="lg" disabled>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="ml-auto flex flex-col items-end gap-2">
          <form action={handleToggleCompletion}>
            <input type="hidden" name="videoId" value={video.id} />
            <input type="hidden" name="completed" value={nextCompletedValue} />
            <Button
              type="submit"
              size="lg"
              disabled={!canTrackProgress}
              variant={optimisticCompleted ? 'default' : 'default'}
            >
              {optimisticCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
            </Button>
          </form>
        </div>
      </CardFooter>
    </Card>
  );
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getFileLabel(filePath: string) {
  const cleanPath = filePath.split(/[?#]/)[0] || '';
  const parts = cleanPath.split(/[/\\]/);
  const filename = parts[parts.length - 1] || '';
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex <= 0) return 'Video';
  return filename.slice(dotIndex + 1).toUpperCase();
}
