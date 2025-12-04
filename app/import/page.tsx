import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function ImportPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <PageHeader
        user={user ? { id: user.id, email: user.email ?? undefined } : null}
        videos={[]}
        showImportButton={false}
        onImportPage
      />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-6xl">
          <EmptyState />
        </div>
      </main>
    </div>
  );
}
