'use client';

import { useActionState, useEffect, useState } from 'react';
import { FolderOpen, Loader2 } from 'lucide-react';

import { syncLibrary, type SyncResult } from '@/app/actions/sync';
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

const initialState: SyncResult = { ok: true, message: null };

export function ConnectLocalModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    syncLibrary,
    initialState
  );

  // Close dialog on successful sync
  useEffect(() => {
    if (state.ok && state.message && !isPending && open) {
      // Optional: Add a toast notification here
      const id = requestAnimationFrame(() => setOpen(false));
      return () => cancelAnimationFrame(id);
    }
  }, [state, isPending, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Scan Local Library</DialogTitle>
          <DialogDescription>
            Enter the absolute path to your video folder on the server.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="path">Folder Path</Label>
            <div className="relative">
              <Input
                id="path"
                name="path"
                placeholder="/home/user/videos"
                className="pl-9"
              />
              <FolderOpen className="text-muted-foreground absolute left-3 top-2.5 h-4 w-4" />
            </div>
            <p className="text-muted-foreground text-xs">
              Leave empty to use the default configured root.
            </p>
          </div>

          {state.message && (
            <p
              className={`text-sm ${
                state.ok ? 'text-emerald-600' : 'text-destructive'
              }`}
            >
              {state.message}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? 'Scanning...' : 'Start Scan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
