// "use client";

// import type * as React from "react";
// import { CheckCircle2, Info, X, XCircle } from "lucide-react";

// import { cn } from "@/lib/utils";

// export type ToastActionElement = React.ReactElement;

// export type ToastProps = {
//   id: string;
//   title?: React.ReactNode;
//   description?: React.ReactNode;
//   action?: ToastActionElement;
//   open?: boolean;
//   onOpenChange?: (open: boolean) => void;
//   variant?: "default" | "success" | "destructive";
// };

// const variantStyles: Record<
//   NonNullable<ToastProps["variant"]>,
//   { container: string; accent: string; icon: React.ReactElement }
// > = {
//   default: {
//     container:
//       "bg-card text-foreground border-border shadow-lg shadow-primary/10 dark:shadow-primary/20",
//     accent: "bg-primary/80 dark:bg-primary/70",
//     icon: <Info className="h-4 w-4 text-primary" />,
//   },
//   success: {
//     container:
//       "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-50 dark:border-emerald-500/30 shadow-lg shadow-emerald-200/60 dark:shadow-emerald-900/50",
//     accent: "bg-emerald-500 dark:bg-emerald-400",
//     icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-300" />,
//   },
//   destructive: {
//     container:
//       "bg-red-50 text-red-900 border-red-200 dark:bg-red-950/40 dark:text-red-50 dark:border-red-500/40 shadow-lg shadow-red-200/60 dark:shadow-red-900/40",
//     accent: "bg-red-500 dark:bg-red-400",
//     icon: <XCircle className="h-4 w-4 text-red-500 dark:text-red-300" />,
//   },
// };

// type ToastCardProps = ToastProps & {
//   onClose: () => void;
// };

// export function ToastCard({
//   title,
//   description,
//   action,
//   variant = "default",
//   open = true,
//   onOpenChange,
//   onClose,
// }: ToastCardProps) {
//   const styles = variantStyles[variant];

//   return (
//     <div
//       className={cn(
//         "pointer-events-auto isolate flex w-full min-w-[280px] max-w-sm overflow-hidden rounded-xl border transition-all duration-200",
//         styles.container,
//         open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
//       )}
//       role="status"
//       aria-live="polite"
//     >
//       <div className={cn("w-1.5", styles.accent)} />
//       <div className="flex w-full items-start gap-3 px-4 py-3">
//         <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-background/60">
//           {styles.icon}
//         </div>
//         <div className="flex-1 space-y-1">
//           {title ? <p className="text-sm font-semibold leading-tight">{title}</p> : null}
//           {description ? (
//             <p className="text-sm text-foreground/80 dark:text-foreground/70">{description}</p>
//           ) : null}
//           {action ? <div className="pt-1">{action}</div> : null}
//         </div>
//         <button
//           type="button"
//           onClick={() => {
//             onOpenChange?.(false);
//             onClose();
//           }}
//           className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-foreground/70 transition hover:bg-foreground/10 hover:text-foreground dark:hover:bg-foreground/20"
//           aria-label="Close notification"
//         >
//           <X className="h-4 w-4" />
//         </button>
//       </div>
//     </div>
//   );
// }
