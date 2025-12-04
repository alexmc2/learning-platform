"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { requireUser } from "@/lib/supabase/server";

export type SaveCourseState = {
  ok: boolean;
  message: string;
};

export async function saveCourse(
  _prevState: SaveCourseState,
  formData: FormData,
): Promise<SaveCourseState> {
  const user = await requireUser();
  const rawName = (formData.get("name") ?? "").toString().trim();
  const rawIds = formData.get("videoIds");

  if (!rawName) {
    return { ok: false, message: "Please provide a course name." };
  }

  const videoIds = parseIds(rawIds);

  if (videoIds.length === 0) {
    return { ok: false, message: "No videos available to save." };
  }

  const uniqueIds = Array.from(new Set(videoIds));

  try {
    await prisma.course.create({
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

    revalidatePath("/");
    revalidatePath("/courses");

    return { ok: true, message: "Course saved" };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        message: "You already have a course with that name.",
      };
    }

    console.error("Failed to save course", error);
    return { ok: false, message: "Failed to save the course." };
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
