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
  const [replace, setReplace] = useState(true);
  const [mode, setMode] = useState<'scan' | 'remove'>('scan');

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
            Enter the absolute path to your video folder on the server. The scan
            is recursive, so point this at a single course folder to avoid
            pulling in your entire library.
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

          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">Mode</legend>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 rounded-md border p-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="scan"
                  checked={mode === 'scan'}
                  onChange={() => setMode('scan')}
                />
                <span className="text-sm">Scan & add</span>
              </label>
              <label className="flex items-center gap-2 rounded-md border p-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="remove"
                  checked={mode === 'remove'}
                  onChange={() => setMode('remove')}
                />
                <span className="text-sm">Remove entries</span>
              </label>
            </div>
          </fieldset>

          {mode === 'scan' ? (
            <label className="flex items-center justify-between rounded-md border p-3 cursor-pointer gap-3">
              <div>
                <p className="text-sm font-medium">Replace existing entries</p>
                <p className="text-muted-foreground text-xs">
                  Remove any local videos already tracked under this folder
                  before reimporting.
                </p>
              </div>
              <input
                type="checkbox"
                name="replace"
                value="true"
                checked={replace}
                onChange={(e) => setReplace(e.target.checked)}
                className="h-4 w-4"
              />
              {!replace && <input type="hidden" name="replace" value="false" />}
            </label>
          ) : (
            <input type="hidden" name="replace" value="false" />
          )}

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
              {isPending
                ? mode === 'remove'
                  ? 'Removing...'
                  : 'Scanning...'
                : mode === 'remove'
                  ? 'Remove entries'
                  : 'Start scan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
