'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { AuthDialog } from '@/components/auth/auth-dialog';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CourseCard } from '@/components/course-card';

type SessionUser = { id: string; email?: string } | null;

export type CourseSummary = {
  id: number;
  name: string;
  totalLessons: number;
  completedLessons: number;
  nextVideoId?: number;
  previewTitles: string[];
  createdAt: string;
};

type SortOption =
  | 'newest'
  | 'oldest'
  | 'name'
  | 'progress-desc'
  | 'progress-asc';

const SORT_STORAGE_KEY = 'courses_sort';

export function CoursesPageContent({
  user,
  courses,
}: {
  user: SessionUser;
  courses: CourseSummary[];
}) {
  const [sort, setSort] = useState<SortOption>(() => {
    if (typeof window === 'undefined') return 'newest';
    const stored = window.localStorage.getItem(SORT_STORAGE_KEY);
    if (
      stored === 'newest' ||
      stored === 'oldest' ||
      stored === 'name' ||
      stored === 'progress-desc' ||
      stored === 'progress-asc'
    ) {
      return stored;
    }
    return 'newest';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SORT_STORAGE_KEY, sort);
  }, [sort]);

  const sortedCourses = useMemo(() => {
    const getProgress = (course: CourseSummary) =>
      course.totalLessons === 0
        ? 0
        : course.completedLessons / course.totalLessons;

    return [...courses].sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'progress-desc':
          return getProgress(b) - getProgress(a);
        case 'progress-asc':
          return getProgress(a) - getProgress(b);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [courses, sort]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <PageHeader user={user} videos={[]} onCoursesPage showImportButton />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-semibold leading-tight">
              Saved Courses
            </h2>
          </div>
          {user && courses.length > 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wide">
                Sort
              </span>
              <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
                <SelectTrigger size="sm" className="min-w-44 bg-background/70 backdrop-blur">
                  <SelectValue aria-label="Sort courses" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="name">Name (A–Z)</SelectItem>
                  <SelectItem value="progress-desc">Most complete</SelectItem>
                  <SelectItem value="progress-asc">Least complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        {!user ? (
          <LoginPrompt />
        ) : courses.length === 0 ? (
          <EmptyCourses />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {sortedCourses.map((course) => (
              <CourseCard key={course.id} {...course} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function LoginPrompt() {
  return (
    <Card className="border border-border/70 bg-card/70">
      <CardContent className="flex flex-col gap-4 p-6">
        <h3 className="text-lg font-semibold">Log in to see your courses</h3>
        <p className="text-sm text-foreground/80">
          Sign in to view and sync saved courses and progress.
        </p>
        <AuthDialog
          trigger={
            <Button variant="default" size="sm" className="self-start">
              Log in
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
}

function EmptyCourses() {
  return (
    <Card className="border border-dashed border-border/70 bg-card/70">
      <CardContent className="flex flex-col gap-3 p-6">
        <h3 className="text-lg font-semibold">No saved courses yet</h3>
        <p className="text-sm text-foreground/80">
          Save a course from the library or Jellyfin import and it will appear
          here with your progress.
        </p>
        <Button asChild variant="secondary" size="sm" className="self-start">
          <Link href="/">Browse videos</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
