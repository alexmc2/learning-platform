import { CoursesPageContent } from "@/components/courses-page-content";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function CoursesPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <CoursesPageContent user={null} courses={[]} />;
  }

  const courses = await prisma.course.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: {
          video: {
            include: {
              progress: {
                where: { userId: user.id },
                select: { completed: true },
              },
            },
          },
        },
      },
    },
  });

  const summaries = courses.map((course) => {
    const totalLessons = course.items.length;
    const completedLessons = course.items.filter(
      (item) => item.video.progress?.[0]?.completed,
    ).length;
    const nextItem =
      course.items.find((item) => !item.video.progress?.[0]?.completed) ??
      course.items[0];

    return {
      id: course.id,
      name: course.name,
      totalLessons,
      completedLessons,
      nextVideoId: nextItem?.videoId,
      previewTitles: course.items.map((item) => item.video.title),
    };
  });

  return (
    <CoursesPageContent
      user={{ id: user.id, email: user.email ?? undefined }}
      courses={summaries}
    />
  );
}
