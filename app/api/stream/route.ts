import fs, { type Stats } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/supabase/server';

export const runtime = 'nodejs';

function toError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get('id');

  if (!idParam) {
    return toError('Missing video id');
  }

  const id = Number(idParam);

  if (!Number.isInteger(id)) {
    return toError('Invalid video id');
  }

  let user: Awaited<ReturnType<typeof requireUser>>;
  try {
    user = await requireUser();
  } catch {
    return toError('Unauthorized', 401);
  }
  const video = await prisma.video.findFirst({
    where: { id, ownerId: user.id },
  });

  if (!video) {
    return toError('Video not found', 404);
  }

  const resolvedPath = path.resolve(video.path);

  // NOTE: Security check removed to allow user-defined paths from the frontend.
  // In a multi-user or public environment, you should validate this against a list of allowed directories.
  /*
  const root = path.resolve(VIDEO_ROOT);
  if (!resolvedPath.startsWith(root)) {
    return toError("Video path is outside of the configured root");
  }
  */

  let stat: Stats;
  try {
    stat = await fs.promises.stat(resolvedPath);
  } catch {
    return toError('Video file missing on disk', 404);
  }

  const rangeHeader = req.headers.get('range');
  const contentType = 'video/mp4';

  if (!rangeHeader) {
    const stream = fs.createReadStream(resolvedPath);
    // Cast to ReadableStream<Uint8Array> for NextResponse compatibility
    const responseStream = Readable.toWeb(stream) as ReadableStream<Uint8Array>;

    return new NextResponse(responseStream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': stat.size.toString(),
        'Accept-Ranges': 'bytes',
      },
    });
  }

  const matches = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
  const size = stat.size;

  if (!matches) {
    return toError('Malformed Range header', 416);
  }

  const start = matches[1] ? Number(matches[1]) : 0;
  const end = matches[2] ? Number(matches[2]) : size - 1;

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= size) {
    return toError('Invalid Range', 416);
  }

  const chunkSize = end - start + 1;
  const stream = fs.createReadStream(resolvedPath, { start, end });
  // Cast to ReadableStream<Uint8Array> for NextResponse compatibility
  const responseStream = Readable.toWeb(stream) as ReadableStream<Uint8Array>;

  return new NextResponse(responseStream, {
    status: 206,
    headers: {
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize.toString(),
      'Content-Type': contentType,
    },
  });
}
