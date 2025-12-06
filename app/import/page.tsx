import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { getCurrentUser } from '@/lib/supabase/server';

export const revalidate = 0;

export default async function ImportPage() {
  const user = await getCurrentUser();

  return (
    // Changed: justify-start + margins prevents clipping on small screens
    <div className="flex min-h-screen flex-col bg-muted/10 overflow-y-auto">
      <PageHeader
        user={user ? { id: user.id, email: user.email ?? undefined } : null}
        videos={[]}
        showImportButton={false}
        onImportPage
      />
      <main className="flex w-full flex-1 flex-col items-start justify-start px-4 py-8 md:items-center md:justify-center md:py-10">
        <div className="w-full max-w-6xl my-auto">
          <EmptyState />
        </div>
      </main>
    </div>
  );
}
