"use client";

import { useActionState } from "react";
import { RefreshCcw } from "lucide-react";

import { syncLibrary, type SyncResult } from "@/app/actions/sync";
import { Button } from "@/components/ui/button";

const initialState: SyncResult = { ok: true, message: null };

export function SyncButton() {
  const [state, formAction, isPending] = useActionState(syncLibrary, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <Button variant="outline" size="sm" className="gap-2" disabled={isPending}>
        <RefreshCcw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? "Syncing..." : "Sync"}
      </Button>
      {state?.message && state.ok === false ? (
        <p
          role="status"
          aria-live="polite"
          className="text-xs text-destructive"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
