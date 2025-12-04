'use client';

import { useTransition } from 'react';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { getBrowserSupabaseClient } from '@/lib/supabase/client';

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
    <Button
      variant="outline"
      size={size}
      onClick={handleSignOut}
      disabled={isPending}
      className="gap-2"
    >
      <LogOut className="h-4 w-4" />
      Log out
    </Button>
  );
}
