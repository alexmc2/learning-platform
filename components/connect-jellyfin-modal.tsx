'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  ArrowLeft,
  Folder,
  Download,
  LogOut,
  ChevronRight,
  HardDrive,
} from 'lucide-react';
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
import { jellyfinApi, type JellyfinItem } from '@/lib/jellyfin';

export interface JellyfinVideo {
  id: number;
  title: string;
  completed: boolean;
  duration: number | null;
  section: string;
  sourceUrl: string;
}

interface ConnectJellyfinModalProps {
  children: React.ReactNode;
  onConnected: (videos: JellyfinVideo[]) => void;
}

export function ConnectJellyfinModal({
  children,
  onConnected,
}: ConnectJellyfinModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // 1=Login, 2=Browse
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auth Data
  const [authData, setAuthData] = useState<{
    serverUrl: string;
    userId: string;
    accessToken: string;
  } | null>(null);

  // Browsing State
  const [currentItems, setCurrentItems] = useState<JellyfinItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<
    { id?: string; name: string }[]
  >([{ name: 'Libraries' }]);
  const [currentParentId, setCurrentParentId] = useState<string | undefined>(
    undefined
  );

  const [formData, setFormData] = useState({
    serverUrl: '',
    username: '',
    password: '',
  });

  // Load URL
  useEffect(() => {
    const savedUrl = localStorage.getItem('jellyfin_url');
    if (savedUrl) setFormData((prev) => ({ ...prev, serverUrl: savedUrl }));
  }, []);

  // Reset on open/close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(1);
        setError('');
        setBreadcrumbs([{ name: 'Libraries' }]);
        setCurrentParentId(undefined);
      }, 300);
    }
  }, [open]);

  // --- Actions ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      localStorage.setItem('jellyfin_url', formData.serverUrl);
      const auth = await jellyfinApi.login(formData);
      setAuthData(auth);

      // Initial fetch: Get Libraries
      const items = await jellyfinApi.browse(
        auth.serverUrl,
        auth.userId,
        auth.accessToken
      );
      setCurrentItems(items);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = async (item: JellyfinItem) => {
    if (!authData) return;
    // If it's a folder/series/library, navigate INTO it
    if (
      item.IsFolder ||
      item.Type === 'CollectionFolder' ||
      item.Type === 'Series' ||
      item.Type === 'Season' ||
      item.Type === 'UserView'
    ) {
      setLoading(true);
      try {
        const children = await jellyfinApi.browse(
          authData.serverUrl,
          authData.userId,
          authData.accessToken,
          item.Id
        );
        setCurrentItems(children);
        setCurrentParentId(item.Id);
        setBreadcrumbs([...breadcrumbs, { id: item.Id, name: item.Name }]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoBack = async () => {
    if (!authData || breadcrumbs.length <= 1) return;
    setLoading(true);
    try {
      const newBreadcrumbs = [...breadcrumbs];
      newBreadcrumbs.pop(); // Remove current
      const parent = newBreadcrumbs[newBreadcrumbs.length - 1]; // Get previous

      const children = await jellyfinApi.browse(
        authData.serverUrl,
        authData.userId,
        authData.accessToken,
        parent.id
      );
      setCurrentItems(children);
      setCurrentParentId(parent.id);
      setBreadcrumbs(newBreadcrumbs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCurrentFolder = async () => {
    if (!authData || !currentParentId) return;
    setLoading(true);
    try {
      // Fetch RECURSIVELY from the CURRENT location
      const videos = await jellyfinApi.getVideos(
        authData.serverUrl,
        authData.userId,
        authData.accessToken,
        currentParentId
      );

      const mapped = videos.map((item, index) => ({
        id: index + 1,
        title: item.Name,
        completed: item.UserData?.Played || false,
        duration: item.RunTimeTicks ? item.RunTimeTicks / 10000000 : null,
        section: breadcrumbs[breadcrumbs.length - 1].name, // Use folder name as section
        sourceUrl: `${authData.serverUrl}/Videos/${item.Id}/stream?static=true&api_key=${authData.accessToken}`,
      }));

      onConnected(mapped);
      setOpen(false);
    } catch (err) {
      setError('Failed to sync this folder.');
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] h-[500px] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? 'Connect to Jellyfin' : 'Browse Library'}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Enter server details.'
              : 'Navigate to your course folder and click Sync.'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <form
            onSubmit={handleLogin}
            className="flex flex-col gap-4 flex-1 justify-center"
          >
            <div className="grid gap-2">
              <Label>Server URL</Label>
              <Input
                name="url"
                value={formData.serverUrl}
                onChange={(e) =>
                  setFormData({ ...formData, serverUrl: e.target.value })
                }
                required
                placeholder="http://192.168.1.5:8096"
              />
            </div>
            <div className="grid gap-2">
              <Label>Username</Label>
              <Input
                name="user"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Password</Label>
              <Input
                name="pass"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              type="submit"
              disabled={loading}
              className="mt-2 bg-[#AA5CC3] text-white hover:bg-[#AA5CC3]/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{' '}
              Login
            </Button>
          </form>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 gap-2">
            {/* Header: Breadcrumbs & Sync Button */}
            <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 p-2">
              <div className="flex items-center gap-1 text-sm font-medium overflow-hidden">
                {breadcrumbs.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={handleGoBack}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <span className="truncate">
                  {breadcrumbs[breadcrumbs.length - 1].name}
                </span>
              </div>
              {/* Only show Sync button if we are inside a library (not at root) */}
              {currentParentId && (
                <Button
                  size="sm"
                  onClick={handleSyncCurrentFolder}
                  disabled={loading}
                  className="bg-[#AA5CC3] hover:bg-[#AA5CC3]/90 text-white shrink-0"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Sync This Folder
                </Button>
              )}
            </div>

            {/* List Items */}
            <div className="flex-1 overflow-y-auto rounded-md border border-border/50 bg-background p-2">
              {currentItems.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  Empty folder
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1">
                  {currentItems.map((item) => (
                    <button
                      key={item.Id}
                      onClick={() => handleNavigate(item)}
                      disabled={loading}
                      className="flex items-center justify-between w-full rounded-md px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {item.IsFolder ||
                        [
                          'Series',
                          'Season',
                          'CollectionFolder',
                          'UserView',
                        ].includes(item.Type) ? (
                          <Folder className="h-4 w-4 text-[#AA5CC3] shrink-0" />
                        ) : (
                          <HardDrive className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="truncate">{item.Name}</span>
                      </div>
                      {(item.IsFolder ||
                        [
                          'Series',
                          'Season',
                          'CollectionFolder',
                          'UserView',
                        ].includes(item.Type)) && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center border-t pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
                className="text-xs text-muted-foreground"
              >
                <LogOut className="mr-2 h-3 w-3" /> Switch User
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
