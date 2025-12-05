'use client';

import { useEffect, useRef, useState } from 'react';
import { useActionState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, MoreVertical, Play } from 'lucide-react';

import {
  resetCourseProgress,
  deleteCourse,
  renameCourse,
  type RenameCourseState,
} from '@/app/actions/course';
import { importJellyfinVideos } from '@/app/actions/sync';
import {
  ConnectJellyfinModal,
  type JellyfinVideo,
} from '@/components/connect-jellyfin-modal';
import { ThemedBounceLoader } from '@/components/themed-bounce-loader';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type CourseCardProps = {
  id: number;
  name: string;
  totalLessons: number;
  completedLessons: number;
  nextVideoId?: number;
  previewTitles: string[];
};

export function CourseCard({
  id,
  name,
  totalLessons,
  completedLessons,
  nextVideoId,
  previewTitles,
}: CourseCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(name);
  const [courseName, setCourseName] = useState(name);
  const initialRenameState: RenameCourseState = { ok: true, message: '' };
  const [renameState, renameAction, renamePending] = useActionState(
    renameCourse,
    initialRenameState
  );
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  useEffect(() => {
    setRenameValue(name);
    setCourseName(name);
  }, [name]);

  useEffect(() => {
    if (renameState.ok && renameState.message && !renamePending) {
      setCourseName(renameValue.trim());
      setRenameOpen(false);
    }
  }, [renamePending, renameState, renameValue]);

  const progressPercent =
    totalLessons === 0
      ? 0
      : Math.round((completedLessons / totalLessons) * 100);
  const isCompleted = totalLessons > 0 && completedLessons === totalLessons;
  const actionLabel = isCompleted ? 'Review' : 'Resume';

  const handleReconnect = async (videos: JellyfinVideo[]) => {
    if (!videos.length) return;

    setIsImporting(true);
    try {
      const result = await importJellyfinVideos(videos);
      if (!result?.ok) {
        throw new Error('Failed to import videos');
      }
      window.location.reload();
    } catch (error) {
      console.error('Jellyfin import failed', error);
      toast({
        title: 'Import failed',
        description: 'Failed to import videos. Please try again.',
        variant: 'destructive',
      });
      setIsImporting(false);
    }
  };

  return (
    <Card className="relative flex h-full flex-col border border-border/70 bg-card shadow-sm">
      {isImporting ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-lg bg-background/90 backdrop-blur-sm">
          <ThemedBounceLoader
            size={56}
            ariaLabel="Importing videos"
            dataTestid={`course-${id}-import-loader`}
          />
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold">Importing videos…</p>
            <p className="text-xs text-muted-foreground">
              We&apos;ll refresh once everything is saved.
            </p>
          </div>
        </div>
      ) : null}
      <div className="absolute right-3 top-3" ref={menuRef}>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8 p-0 text-muted-foreground"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Course actions"
          aria-expanded={menuOpen}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
        <div
          className={cn(
            'absolute right-0 z-20 mt-1 w-44 rounded-md border border-border/70 bg-popover shadow-lg transition-opacity',
            menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
        >
          <div className="flex flex-col divide-y divide-border/70">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted/70 cursor-pointer"
                  onClick={() => setMenuOpen(false)}
                >
                  Reset progress
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <form action={resetCourseProgress} className="space-y-4">
                  <input type="hidden" name="courseId" value={id} />
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset course progress?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will clear completion for all lessons in this course
                      for your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                    <AlertDialogAction type="submit" className="cursor-pointer">
                      Reset progress
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </form>
            </AlertDialogContent>
          </AlertDialog>

            <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted/70 cursor-pointer"
                  onClick={() => {
                    setMenuOpen(false);
                    setRenameValue(courseName);
                  }}
                >
                  Rename course
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rename course</DialogTitle>
                </DialogHeader>
                <form action={renameAction} className="space-y-4">
                  <input type="hidden" name="courseId" value={id} />
                  <div className="space-y-2">
                    <Label htmlFor={`course-name-${id}`}>New name</Label>
                    <Input
                      id={`course-name-${id}`}
                      name="name"
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      required
                    />
                  </div>
                  {renameState.message ? (
                    <p
                      className={cn(
                        'text-sm',
                        renameState.ok ? 'text-emerald-600' : 'text-destructive'
                      )}
                    >
                      {renameState.message}
                    </p>
                  ) : null}
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRenameOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={renamePending}>
                      {renamePending ? 'Renaming...' : 'Rename'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-muted/70 cursor-pointer"
                  onClick={() => setMenuOpen(false)}
                >
                  Delete course
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <form action={deleteCourse} className="space-y-4">
                  <input type="hidden" name="courseId" value={id} />
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this course?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes the course and permanently deletes the
                      associated videos from your library.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                    <AlertDialogAction type="submit" className="cursor-pointer">
                      Delete course
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </form>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
      <CardHeader className="pr-12">
        <CardTitle className="text-lg">
          <span className="truncate">{courseName}</span>
        </CardTitle>
        <span className="text-sm font-normal text-foreground/80">
          {completedLessons}/{totalLessons} complete
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-2 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-emerald-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          {previewTitles.slice(0, 3).map((title, index) => (
            <div key={title} className="flex items-center gap-2">
              <CheckCircle2
                className={cn(
                  'h-4 w-4',
                  index < completedLessons
                    ? 'text-emerald-500'
                    : 'text-muted-foreground'
                )}
              />
              <span className="truncate">{title}</span>
            </div>
          ))}
          {previewTitles.length === 0 ? (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-foreground/80" />
              <span className="text-sm text-foreground/80">
                No lessons in this course yet.
              </span>
            </div>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="text-sm text-foreground/80">
          Progress: {progressPercent}% complete
        </div>
        {nextVideoId ? (
          <Button asChild size="sm" className="gap-2">
            <Link href={`/?courseId=${id}&v=${nextVideoId}`}>
              <Play className="h-4 w-4" />
              {actionLabel}
            </Link>
          </Button>
        ) : (
          <ConnectJellyfinModal onConnected={handleReconnect}>
            <Button size="sm" className="gap-2">
              <Play className="h-4 w-4" />
              Resume
            </Button>
          </ConnectJellyfinModal>
        )}
      </CardFooter>
    </Card>
  );
}
