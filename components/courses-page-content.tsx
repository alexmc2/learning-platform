import Link from 'next/link';

import { AuthDialog } from '@/components/auth/auth-dialog';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CourseCard } from '@/components/course-card';

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
      <PageHeader user={user} videos={[]} onCoursesPage showImportButton />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-semibold leading-tight">
              Saved Courses
            </h2>
          </div>
        </div>

        {!user ? (
          <LoginPrompt />
        ) : courses.length === 0 ? (
          <EmptyCourses />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {courses.map((course) => (
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
