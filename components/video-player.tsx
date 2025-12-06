'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Film,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';

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
import { cn } from '@/lib/utils';

type VideoPlayerProps = {
  video: {
    id: number;
    title: string;
    completed: boolean;
    duration: number | null;
    path: string;
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
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const isRemote = video.path.startsWith('http');
  const streamUrl = isRemote ? video.path : `/api/stream?id=${video.id}`;
  const fileLabel = getFileLabel(video.path);
  const nextCompletedValue = (!video.completed).toString();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration ?? 0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isTouch, setIsTouch] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  const getLink = (id: number) => {
    return courseId ? `/?courseId=${courseId}&v=${id}` : `/?v=${id}`;
  };

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

  useEffect(() => {
    const el = videoRef.current;
    if (el) {
      el.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(pointer: coarse)');
    const updateTouch = (event?: MediaQueryListEvent) => {
      setIsTouch(event ? event.matches : mql.matches);
    };
    updateTouch();
    if (mql.addEventListener) {
      mql.addEventListener('change', updateTouch);
      return () => mql.removeEventListener('change', updateTouch);
    }
    // Fallback for older browsers
    mql.addListener(updateTouch);
    return () => mql.removeListener(updateTouch);
  }, []);

  const describePlaybackIssue = (
    mediaError?: MediaError | null,
    domError?: unknown
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

  const renderControls = (mode: 'overlay' | 'stacked') => {
    const isOverlay = mode === 'overlay';
    const visibilityClass = isOverlay
      ? 'pointer-events-none absolute inset-x-0 bottom-0 pb-3 opacity-0 transition-opacity duration-200 group-hover/video:opacity-100 group-focus-within/video:opacity-100'
      : 'w-full pt-3';
    const paddingClass = isOverlay ? 'px-4' : 'px-3';
    const seekWrapperClass = isOverlay ? 'pointer-events-auto' : '';

    // Changed: Always use flex-nowrap and justify-between for single line
    const shellClass = isOverlay
      ? 'pointer-events-auto flex items-center justify-between gap-3'
      : 'flex items-center justify-between gap-2';

    return (
      <div className={`${visibilityClass} flex flex-col gap-2`}>
        <div className={`${seekWrapperClass} ${paddingClass}`}>
          <input
            type="range"
            min={0}
            max={duration || video.duration || 0}
            step={0.1}
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20 outline-none"
            style={{
              background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${progressPercent}%, rgba(0,0,0,0.45) ${progressPercent}%, rgba(0,0,0,0.45) 100%)`,
            }}
            aria-label="Seek"
          />
        </div>

        {/* Controls Row - Single Line */}
        <div className={`${shellClass} ${paddingClass}`}>
          {/* Left Side: Play, Mute, Volume (Hidden on small mobile), Time */}
          <div className="flex items-center gap-2 rounded-md bg-black/60 px-2 py-1.5 md:px-3 md:py-2">
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

            <div className="flex items-center gap-1">
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

              {/* Hide volume slider on touch devices or very small screens to save space */}
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
            </div>

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

          {/* Right Side: Speed, Fullscreen */}
          <div className="flex items-center gap-2 rounded-md bg-black/60 px-2 py-1.5 md:px-3 md:py-2">
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

  return (
    <Card className="flex w-full flex-col overflow-hidden bg-background shadow-none border-none px-0 md:px-6">
      <CardContent className="p-0">
        <div className="flex w-full flex-col items-center justify-center gap-3">
          <div className="group/video relative aspect-video w-full max-h-[70vh] overflow-hidden bg-black md:rounded-lg">
            <video
              ref={videoRef}
              key={video.id}
              className="h-full w-full cursor-pointer object-contain"
              preload="metadata"
              src={streamUrl}
              onClick={togglePlay}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleVideoError}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {/* Always use 'overlay' style visually for cleaner look, or swap based on touch preference if desired.
                Keeping logic similar to before but unified styling. */}
            {!isTouch ? renderControls('overlay') : renderControls('stacked')}
          </div>
        </div>
        {errorMessage ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 flex w-full flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <p>{errorMessage}</p>
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
      <CardHeader className="flex flex-col gap-4 px-4 pt-4 md:px-0">
        <div className="flex flex-wrap items-center gap-3">
          {video.completed ? (
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
        <CardTitle className="text-xl font-semibold leading-tight md:text-2xl">
          {video.title}
        </CardTitle>
      </CardHeader>

      {/* Footer Navigation */}
      <CardFooter className="flex flex-col gap-3 border-t border-border/60 px-4 py-4 md:px-0">
        <div className="flex w-full flex-col gap-3">
          {/* Row 1: Previous / Next */}
          <div className="grid grid-cols-2 gap-3 w-full">
            {prevId ? (
              <Button asChild variant="secondary" size="lg" className="w-full">
                <Link href={getLink(prevId)}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Link>
              </Button>
            ) : (
              <Button variant="secondary" size="lg" disabled className="w-full">
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

          {/* Row 2: Mark as Complete */}
          <form action={setVideoCompletion} className="w-full">
            <input type="hidden" name="videoId" value={video.id} />
            <input type="hidden" name="completed" value={nextCompletedValue} />
            <Button
              type="submit"
              size="lg"
              disabled={!canTrackProgress}
              variant={video.completed ? 'outline' : 'default'}
              className={cn(
                'w-full gap-2',
                video.completed
                  ? 'border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              )}
            >
              {video.completed ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Incomplete
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Complete
                </>
              )}
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
