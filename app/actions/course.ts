'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma/client';
import { requireUser } from '@/lib/supabase/server';

export type SaveCourseState = {
  ok: boolean;
  message: string;
};

export type RenameCourseState = {
  ok: boolean;
  message: string;
};

export async function saveCourse(
  _prevState: SaveCourseState,
  formData: FormData
): Promise<SaveCourseState> {
  const user = await requireUser();
  const rawName = (formData.get('name') ?? '').toString().trim();
  const rawIds = formData.get('videoIds');

  if (!rawName) {
    return { ok: false, message: 'Please provide a course name.' };
  }

  const videoIds = parseIds(rawIds);

  if (videoIds.length === 0) {
    return { ok: false, message: 'No videos available to save.' };
  }

  const uniqueIds = Array.from(new Set(videoIds));

  if (uniqueIds.length > 0) {
    const ownedCount = await prisma.video.count({
      where: { ownerId: user.id, id: { in: uniqueIds } },
    });

    if (ownedCount !== uniqueIds.length) {
      return {
        ok: false,
        message: 'Some videos are missing or not available to your account.',
      };
    }
  }

  // Variables to hold IDs for redirection after the try/catch block
  let courseId: number | undefined;
  let firstVideoId: number | undefined;

  try {
    const course = await prisma.course.create({
      data: {
        name: rawName,
        ownerId: user.id,
        items: {
          create: uniqueIds.map((videoId, position) => ({
            videoId,
            position,
          })),
        },
      },
    });

    // Capture IDs for redirect
    courseId = course.id;
    firstVideoId = uniqueIds[0];

    revalidatePath('/');
    revalidatePath('/courses');
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return {
        ok: false,
        message: 'You already have a course with that name.',
      };
    }

    console.error('Failed to save course', error);
    return { ok: false, message: 'Failed to save the course.' };
  }

  // Perform redirect outside of try/catch to ensure proper Next.js handling
  if (courseId && firstVideoId) {
    redirect(`/?courseId=${courseId}&v=${firstVideoId}`);
  }

  return { ok: true, message: 'Course saved' };
}

export async function renameCourse(
  _prevState: RenameCourseState,
  formData: FormData
): Promise<RenameCourseState> {
  const user = await requireUser();
  const courseId = Number(formData.get('courseId'));
  const rawName = (formData.get('name') ?? '').toString().trim();

  if (!Number.isInteger(courseId)) {
    return { ok: false, message: 'Invalid course id.' };
  }

  if (!rawName) {
    return { ok: false, message: 'Please provide a course name.' };
  }

  try {
    await prisma.course.update({
      where: { id: courseId, ownerId: user.id },
      data: { name: rawName },
    });

    revalidatePath('/courses');
    revalidatePath('/');

    return { ok: true, message: 'Course renamed' };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return {
        ok: false,
        message: 'You already have a course with that name.',
      };
    }

    console.error('Failed to rename course', error);
    return { ok: false, message: 'Failed to rename the course.' };
  }
}

function parseIds(value: FormDataEntryValue | null): number[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(Number).filter(Number.isInteger);
  }

  try {
    const parsed = JSON.parse(value.toString()) as number[];
    return Array.isArray(parsed)
      ? parsed.map(Number).filter(Number.isInteger)
      : [];
  } catch {
    return [];
  }
}

export async function resetCourseProgress(formData: FormData) {
  const user = await requireUser();
  const courseId = Number(formData.get('courseId'));

  if (!Number.isInteger(courseId)) {
    throw new Error('Invalid course id');
  }

  const videos = await prisma.courseVideo.findMany({
    where: {
      course: { id: courseId, ownerId: user.id },
    },
    select: { videoId: true },
  });

  const videoIds = videos.map((item) => item.videoId);
  if (videoIds.length > 0) {
    await prisma.videoProgress.deleteMany({
      where: {
        userId: user.id,
        videoId: { in: videoIds },
      },
    });
  }

  revalidatePath('/courses');
  revalidatePath('/');
}

export async function deleteCourse(formData: FormData) {
  const user = await requireUser();
  const courseId = Number(formData.get('courseId'));

  if (!Number.isInteger(courseId)) {
    throw new Error('Invalid course id');
  }

  const courseVideos = await prisma.courseVideo.findMany({
    where: {
      course: { id: courseId, ownerId: user.id },
    },
    select: { videoId: true },
  });

  const videoIds = courseVideos.map((cv) => cv.videoId);

  await prisma.course.delete({
    where: { id: courseId, ownerId: user.id },
  });

  if (videoIds.length > 0) {
    await prisma.video.deleteMany({
      where: {
        id: { in: videoIds },
        ownerId: user.id,
      },
    });
  }

  revalidatePath('/courses');
  revalidatePath('/');
}
