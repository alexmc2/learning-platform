import Link from 'next/link';
import { CheckCircle2, Clock, Play } from 'lucide-react';

import { AuthDialog } from '@/components/auth/auth-dialog';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type SessionUser = { id: string; email?: string } | null;

export type CourseSummary = {
  id: number;
  name: string;
  totalLessons: number;
  completedLessons: number;
  nextVideoId?: number;
  previewTitles: string[];
};

export function CoursesPageContent({
  user,
  courses,
}: {
  user: SessionUser;
  courses: CourseSummary[];
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <PageHeader user={user} videos={[]} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-semibold leading-tight">
              Saved Courses
            </h2>
          </div>
          {user ? (
            <Button asChild variant="default">
              <Link href="/">Back to course</Link>
            </Button>
          ) : null}
        </div>

        {!user ? (
          <LoginPrompt />
        ) : courses.length === 0 ? (
          <EmptyCourses />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CourseCard({ course }: { course: CourseSummary }) {
  const progressPercent =
    course.totalLessons === 0
      ? 0
      : Math.round((course.completedLessons / course.totalLessons) * 100);

  return (
    <Card className="flex h-full flex-col border border-border/70 bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3 text-lg">
          <span className="truncate">{course.name}</span>
        </CardTitle>
        <span className="text-sm font-normal text-foreground/80">
          {course.completedLessons}/{course.totalLessons} complete
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-2 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="space-y-2 text-sm text-foreground/80">
          {course.previewTitles.slice(0, 3).map((title, index) => (
            <div key={title} className="flex items-center gap-2">
              <CheckCircle2
                className={cn(
                  'h-4 w-4',
                  index < course.completedLessons
                    ? 'text-emerald-500'
                    : 'text-foreground/80'
                )}
              />
              <span className="truncate">{title}</span>
            </div>
          ))}
          {course.previewTitles.length === 0 ? (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-foreground/80" />
              <span className="text-sm">No lessons in this course yet.</span>
            </div>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="text-sm text-foreground/80">
          Progress: {progressPercent}% complete
        </div>
        <Button
          asChild
          size="sm"
          disabled={!course.nextVideoId}
          className="gap-2"
        >
          <Link href={course.nextVideoId ? `/?v=${course.nextVideoId}` : '#'}>
            <Play className="h-4 w-4" />
            {course.completedLessons === course.totalLessons
              ? 'Review'
              : 'Resume'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function LoginPrompt() {
  return (
    <Card className="border border-border/70 bg-card/70">
      <CardContent className="flex flex-col gap-4 p-6">
        <h3 className="text-lg font-semibold">Log in to see your courses</h3>
        <p className="text-sm text-foreground/80">
          Sign in with Supabase to view and sync saved courses and progress.
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
