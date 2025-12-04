'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getBrowserSupabaseClient } from '@/lib/supabase/client';

type AuthDialogProps = {
  trigger?: React.ReactNode;
};

export function AuthDialog({ trigger }: AuthDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email')?.toString().trim() ?? '';
    const password = formData.get('password')?.toString() ?? '';

    startTransition(async () => {
      const supabase = getBrowserSupabaseClient();

      const { error } =
        mode === 'signin'
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage('Success! Refreshing your session...');
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <LogIn className="h-4 w-4" />
            Log in
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'signin' ? 'Log in to save progress' : 'Create an account'}
          </DialogTitle>
          <DialogDescription>
            Use your Supabase credentials to keep courses and progress synced.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
            />
          </div>

          {message ? (
            <p
              className={`text-sm ${
                message.toLowerCase().includes('success')
                  ? 'text-emerald-600'
                  : 'text-destructive'
              }`}
            >
              {message}
            </p>
          ) : null}

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2 text-sm"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              {mode === 'signin' ? (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create account
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  I already have an account
                </>
              )}
            </Button>

            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Working...'
                : mode === 'signin'
                  ? 'Log in'
                  : 'Sign up'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
