"use client";

import BounceLoader from "react-spinners/BounceLoader";

import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

type ThemedBounceLoaderProps = {
  loading?: boolean;
  size?: number;
  ariaLabel?: string;
  dataTestid?: string;
  className?: string;
};

export function ThemedBounceLoader({
  loading = true,
  size = 60,
  ariaLabel = "Loading spinner",
  dataTestid = "loader",
  className,
}: ThemedBounceLoaderProps) {
  const { theme } = useTheme();
  const color = theme === 'dark' ? '#4338ca' : '#4338ca';

  return (
    <div className={cn("inline-flex items-center justify-center", className)}>
      <BounceLoader
        color={color}
        loading={loading}
        size={size}
        aria-label={ariaLabel}
        data-testid={dataTestid}
      />
    </div>
  );
}
