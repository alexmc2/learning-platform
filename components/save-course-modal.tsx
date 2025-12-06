'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { BookmarkPlus, CheckCircle2 } from 'lucide-react';

import { saveCourse, type SaveCourseState } from '@/app/actions/course';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type SaveCourseModalProps = {
  videos: { id: number; title: string; section?: string }[];
  disabled?: boolean;
  forceOpen?: boolean;
};

const initialState: SaveCourseState = {
  ok: true,
  message: '',
};

export function SaveCourseModal({
  videos,
  disabled,
  forceOpen = false,
}: SaveCourseModalProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    saveCourse,
    initialState
  );
  const videoIds = useMemo(() => videos.map((video) => video.id), [videos]);

  const defaultName = useMemo(() => {
    const sections = Array.from(
      new Set(videos.map((video) => video.section).filter(Boolean))
    );
    if (sections.length === 1) return `${sections[0]} Course`;
    if (videos.length > 0) return `${videos.length} Lesson Course`;
    return 'My Course';
  }, [videos]);

  const [name, setName] = useState(defaultName);

  useEffect(() => {
    setName(defaultName);
  }, [defaultName]);

  useEffect(() => {
    if (forceOpen && videos.length > 0 && !disabled) {
      setOpen(true);
    }
  }, [forceOpen, videos.length, disabled]);

  useEffect(() => {
    if (state.ok && state.message && !isPending) {
      setOpen(false);
    }
  }, [state.ok, state.message, isPending]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="gap-2"
          disabled={disabled || videos.length === 0}
        >
          <BookmarkPlus className="h-4 w-4" />
          Save course
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save this course</DialogTitle>
          <DialogDescription>Please enter a course name</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course-name">Course name</Label>
            <Input
              id="course-name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              placeholder="Course name"
            />
          </div>

          <input
            type="hidden"
            name="videoIds"
            value={JSON.stringify(videoIds)}
            readOnly
          />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{videoIds.length} lessons will be saved.</span>
            {state.message ? (
              <span
                className={cn(
                  'flex items-center gap-2 text-xs',
                  state.ok ? 'text-emerald-600' : 'text-destructive'
                )}
              >
                {state.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                {state.message}
              </span>
            ) : null}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save course'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
