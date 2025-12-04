'use client';

import { useTransition } from 'react';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { getBrowserSupabaseClient } from '@/lib/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type LogoutButtonProps = {
  size?: 'sm' | 'default' | 'lg';
};

export function LogoutButton({ size = 'sm' }: LogoutButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      const supabase = getBrowserSupabaseClient();
      await supabase.auth.signOut();
      router.refresh();
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size={size}
          disabled={isPending}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign out?</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ll need to log back in to sync courses and progress.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Stay signed in</AlertDialogCancel>
          <AlertDialogAction
            asChild
            disabled={isPending}
          >
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={handleSignOut}
            >
              {isPending ? 'Signing out...' : 'Sign out'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
