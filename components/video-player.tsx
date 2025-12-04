'use client';

import Link from 'next/link';
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
  const isRemote = video.path.startsWith('http');
  const streamUrl = isRemote ? video.path : `/api/stream?id=${video.id}`;
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
      : 'w-full pt-2';
    const paddingClass = isOverlay ? 'px-4' : 'px-3';
    const seekWrapperClass = isOverlay ? 'pointer-events-auto' : '';
    const shellClass = isOverlay
      ? 'pointer-events-auto flex flex-wrap items-center gap-3'
      : 'flex flex-wrap items-center gap-3';

    return (
      <div className={`${visibilityClass} flex flex-col gap-3`}>
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
        <div className={`${shellClass} ${paddingClass}`}>
          <div className="flex items-center gap-3 rounded-md bg-black/60 px-3 py-2">
            <button
              type="button"
              onClick={togglePlay}
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="h-1 w-24 cursor-pointer accent-white"
              aria-label="Volume"
            />
            <div className="ml-2 flex items-center gap-1 text-xs font-medium text-white/80">
              <span className="tabular-nums">
                {formatDuration(Math.floor(currentTime))}
              </span>
              <span className="text-white/50">/</span>
              <span className="tabular-nums">
                {formatDuration(Math.floor(duration || video.duration || 0))}
              </span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3 rounded-md bg-black/60 px-3 py-2">
            <label className="sr-only" htmlFor="playback-rate">
              Playback speed
            </label>
            <select
              id="playback-rate"
              value={playbackRate}
              onChange={(e) => setPlaybackRate(Number(e.target.value))}
              className="cursor-pointer rounded-md bg-white/10 px-3 py-2 text-xs font-medium text-white outline-none transition hover:bg-white/20"
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
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="flex w-full flex-col overflow-hidden bg-background shadow-none border-none px-6">
      <CardContent className="p-0">
        <div className="flex w-full flex-col items-center justify-center gap-3">
          <div className="group/video relative aspect-video w-full max-h-[70vh] overflow-hidden bg-background">
            <video
              ref={videoRef}
              key={video.id}
              className="h-full w-full cursor-pointer bg-background object-contain"
              preload="metadata"
              src={streamUrl}
              onClick={togglePlay}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleVideoError}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {!isTouch && renderControls('overlay')}
          </div>
          {isTouch && renderControls('stacked')}
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
      <CardHeader className="flex flex-col gap-4">
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
            {video.duration ? `~${formatDuration(video.duration)}` : 'MP4'}
          </CardDescription>
        </div>
        <CardTitle className="text-2xl font-semibold leading-tight">
          {video.title}
        </CardTitle>
      </CardHeader>
      <CardFooter className="flex flex-wrap items-center gap-3 border-t border-border/60 px-6 py-4">
        <div className="flex items-center gap-2">
          {prevId ? (
            <Button asChild variant="default" size="lg">
              <Link href={`/?v=${prevId}`}>
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
              <Link href={`/?v=${nextId}`}>
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
          <form action={setVideoCompletion}>
            <input type="hidden" name="videoId" value={video.id} />
            <input type="hidden" name="completed" value={nextCompletedValue} />
            <Button
              type="submit"
              size="lg"
              disabled={!canTrackProgress}
              variant={video.completed ? 'default' : 'default'}
            >
              {video.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
            </Button>
          </form>
          {!canTrackProgress ? (
            <p className="text-xs text-muted-foreground">
              Log in to track and sync your progress.
            </p>
          ) : null}
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
