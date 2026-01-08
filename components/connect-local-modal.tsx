'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { importVideoManifest } from '@/app/actions/import-manifest';
import {
  scanDirectoryForManifest,
  type FileSystemDirectoryHandle,
} from '@/lib/browser-fs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ConnectLocalModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [virtualRoot, setVirtualRoot] = useState('/home/user/videos');

  const handleScan = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        toast.error('Your browser does not support local file access.');
        return;
      }

      setIsScanning(true);

      // @ts-expect-error - showDirectoryPicker is experimental
      const handle = await window.showDirectoryPicker();
      if (!handle) {
        setIsScanning(false);
        return;
      }

      const dirHandle = handle as FileSystemDirectoryHandle;

      toast.info('Scanning folder...');

      const videos = await scanDirectoryForManifest(dirHandle, virtualRoot);

      if (videos.length === 0) {
        toast.warning('No video files found in that folder.');
        setIsScanning(false);
        return;
      }

      toast.info(`Found ${videos.length} videos. Importing metadata...`);

      const result = await importVideoManifest(videos);

      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        // Refresh page to show new videos
        window.location.href = '/?promptSave=1&source=local';
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error('Scan failed', err);
      toast.error('Failed to scan folder.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Scan Local Library (Browser)</DialogTitle>
          <DialogDescription>
            Select a folder on your computer to scan. The browser will read the
            filenames and add them to your library. Your videos stay on your
            computer.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="virtual-root">Virtual Path Prefix</Label>
            <Input
              id="virtual-root"
              value={virtualRoot}
              onChange={(e) => setVirtualRoot(e.target.value)}
              placeholder="/home/user/videos"
            />
            <p className="text-muted-foreground text-xs">
              This path will be stored in the database as the location of these
              files.
            </p>
          </div>

          <div className="rounded-md bg-secondary/20 p-4 text-sm text-secondary-foreground">
            <p className="font-semibold mb-1">How this works:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>We scan filenames in your selected folder.</li>
              <li>
                We send <strong>only metadata</strong> (names/paths) to the
                server.
              </li>
              <li>
                Actual video files are <strong>never uploaded</strong>.
              </li>
            </ul>
          </div>

          <DialogFooter>
            <Button onClick={handleScan} disabled={isScanning}>
              {isScanning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isScanning ? 'Scanning...' : 'Select Folder & Scan'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
