'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, MoreVertical, Play } from 'lucide-react';

import { resetCourseProgress, deleteCourse } from '@/app/actions/course';
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

  const progressPercent =
    totalLessons === 0
      ? 0
      : Math.round((completedLessons / totalLessons) * 100);

  return (
    <Card className="relative flex h-full flex-col border border-border/70 bg-card/80">
      <CardHeader className="pr-12">
        <CardTitle className="flex items-center justify-between gap-3 text-lg">
          <span className="truncate">{name}</span>
          <div>
            <span className="text-sm font-normal text-muted-foreground">
              {completedLessons}/{totalLessons} complete
            </span>
          </div>
        </CardTitle>
        <div className="absolute right-3 top-3" ref={menuRef}>
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8 p-0 text-muted-foreground"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Course actions"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
          {menuOpen ? (
            <div className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-border/70 bg-popover shadow-lg">
              <div className="flex flex-col divide-y divide-border/70">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="px-3 py-2 text-left text-sm hover:bg-muted/70"
                      onClick={() => setMenuOpen(false)}
                    >
                      Reset progress
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset course progress?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will clear completion for all lessons in this course for your account.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <form action={resetCourseProgress}>
                        <input type="hidden" name="courseId" value={id} />
                        <AlertDialogAction asChild>
                          <Button type="submit" variant="destructive" size="sm">
                            Reset progress
                          </Button>
                        </AlertDialogAction>
                      </form>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="px-3 py-2 text-left text-sm text-destructive hover:bg-muted/70"
                      onClick={() => setMenuOpen(false)}
                    >
                      Delete course
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this course?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the course and its items. Video files stay untouched.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <form action={deleteCourse}>
                        <input type="hidden" name="courseId" value={id} />
                        <AlertDialogAction asChild>
                          <Button type="submit" variant="destructive" size="sm">
                            Delete course
                          </Button>
                        </AlertDialogAction>
                      </form>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-2 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
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
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">No lessons in this course yet.</span>
            </div>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Progress: {progressPercent}% complete
        </div>
        <Button
          asChild
          size="sm"
          disabled={!nextVideoId}
          className="gap-2"
        >
          <Link href={nextVideoId ? `/?v=${nextVideoId}` : '#'} aria-disabled={!nextVideoId}>
            <Play className="h-4 w-4" />
            {completedLessons === totalLessons ? 'Review' : 'Resume'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
