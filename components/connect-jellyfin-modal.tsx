'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { jellyfinApi } from '@/lib/jellyfin';

interface JellyfinVideo {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    serverUrl: 'http://localhost:8096',
    username: '',
    password: '',
  });

  const handleConnect = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Authenticate
      const authData = await jellyfinApi.login(formData);

      // 2. Fetch Videos
      const items = await jellyfinApi.getVideos(
        authData.serverUrl,
        authData.userId,
        authData.accessToken
      );

      // 3. Map Jellyfin items to your App's Video format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedVideos = items.map((item: any, index: number) => ({
        id: index + 1, // Or generate a unique ID based on item.Id
        title: item.Name,
        completed: item.UserData?.Played || false,
        duration: item.RunTimeTicks ? item.RunTimeTicks / 10000000 : null, // Ticks to seconds
        section: 'Jellyfin Library',
        sourceUrl: `${authData.serverUrl}/Videos/${item.Id}/stream?static=true&api_key=${authData.accessToken}`,
      }));

      onConnected(mappedVideos);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect to Jellyfin</DialogTitle>
          <DialogDescription>
            Enter your server details to sync your library.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="url">Server URL</Label>
            <Input
              id="url"
              placeholder="http://192.168.1.5:8096"
              value={formData.serverUrl}
              onChange={(e) =>
                setFormData({ ...formData, serverUrl: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            onClick={handleConnect}
            disabled={loading}
            className="bg-[#AA5CC3] hover:bg-[#AA5CC3]/90 text-white"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
